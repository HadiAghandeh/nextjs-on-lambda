import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

const deployRegion = process.env.CDK_DEFAULT_REGION;
const deployAccount = process.env.CDK_DEFAULT_ACCOUNT;

export class NextJsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 Bucket for static assets (Next.js build output and public/)
    const staticBucket = new s3.Bucket(this, 'MyNextStaticAssets', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // DESTROY for dev/test, RETAIN for production
    });

    // 2. Deploy static files to S3 (from local build output folders)
    new s3deploy.BucketDeployment(this, 'DeployNextStaticFiles', {
      destinationBucket: staticBucket,
      // Assuming build output: .next/static and your public folder:
      sources: [
        s3deploy.Source.asset('../nextjs-lambda/.next/static', { exclude: ['*/fallback/*'] }), // Next static assets
      ],
      destinationKeyPrefix: '_next/static',  // upload at root of bucket
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)), // 1 year
        s3deploy.CacheControl.immutable()
      ],
    });

    new s3deploy.BucketDeployment(this, 'DeployNextPublicFiles', {
      destinationBucket: staticBucket,
      // Assuming build output: .next/static and your public folder:
      sources: [
        s3deploy.Source.asset('../nextjs-lambda/public'),  // Public folder files
      ],
      destinationKeyPrefix: '_next/public',  // upload at root of bucket
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)), // 1 year
        s3deploy.CacheControl.immutable()
      ],
    });

    // 3. Lambda function for Next.js SSR & API routes (from Docker image)
    const ssrFunction = new lambda.Function(this, 'NextSsrLambda', {
      runtime: lambda.Runtime.FROM_IMAGE,
      code: lambda.Code.fromAssetImage('../nextjs-lambda'),
      handler: lambda.Handler.FROM_IMAGE,
      memorySize: 2048,
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_ENV: 'production'
      },
    });

    // 4. API Gateway to trigger the Lambda
    const api = new apigw.LambdaRestApi(this, 'NextApiGateway', {
      handler: ssrFunction,
      binaryMediaTypes: ['*/*'],
      deployOptions: { stageName: 'prod' }
    });

    // The API endpoint will be: https://<apiId>.execute-api.<region>.amazonaws.com/prod
    const apiDomain = `${api.restApiId}.execute-api.${this.region}.amazonaws.com`;

    // 5. CloudFront distribution with multiple origins (API Gateway and S3)
    // Set up cache policies:
    const noCachePolicy = new cloudfront.CachePolicy(this, 'NoCachePolicy', {
      cachePolicyName: 'NoCachePolicy',
      defaultTtl: cdk.Duration.seconds(0),
      minTtl: cdk.Duration.seconds(0),
      maxTtl: cdk.Duration.seconds(0),
      // No caching at CloudFront, but we will still use an origin request policy to forward all.
    });
    const staticCachePolicy = new cloudfront.CachePolicy(this, 'StaticCachePolicy', {
      cachePolicyName: 'StaticCachePolicy',
      // Long TTL for static assets (1 year)
      defaultTtl: cdk.Duration.days(365),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.days(1),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),    // don’t vary on headers
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),    // don’t send cookies
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none() // no query strings for static files
    });
    // Origin Request policy to forward all details to Lambda origin (for dynamic content)
    const originRequestAll = new cloudfront.OriginRequestPolicy(this, 'OriginRequestAll', {
      originRequestPolicyName: 'AllViewerRequests',
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.all(),
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.all(),  // forward all headers
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
    });

    // Set up origins for CloudFront
    // Using Origin Access Control (OAC) for S3:
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(staticBucket);
    // (If your CDK version doesn't have withOriginAccessControl, you can fall back to:
    // const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessId');
    // staticBucket.grantRead(originAccessIdentity);
    // const s3Origin = new origins.S3Origin(staticBucket, { originAccessIdentity });
    // )

    const apiOrigin = new origins.HttpOrigin(apiDomain, {
      originPath: `/${api.deploymentStage.stageName}`, // "/prod"
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    const corsPolicy = new cloudfront.ResponseHeadersPolicy(this, 'StaticCorsPolicy', {
      corsBehavior: {
        accessControlAllowOrigins: ['*'], // or '*' if no credentials
        accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
        accessControlAllowHeaders: ['*'],
        accessControlExposeHeaders: ['*'],
        accessControlAllowCredentials: false, // true only if you actually send cookies/credentials
        originOverride: true,
      } as cloudfront.ResponseHeadersCorsBehavior,
    });

    // Create the CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'NextCloudFront', {
      defaultBehavior: {
        origin: apiOrigin,
        cachePolicy: noCachePolicy,
        originRequestPolicy: originRequestAll,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // allow all HTTP methods so Lambda can handle POST/PUT if needed (for API routes)
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      },
      additionalBehaviors: {
        // Next.js static assets
        '/_next/static/*': {
          origin: s3Origin,
          cachePolicy: staticCachePolicy,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,  // static files are GET/HEAD only
          responseHeadersPolicy: corsPolicy,
        }
        // You can add more behaviors for other public assets or patterns as needed.
      },
      // Optionally, you can attach an AWS WAF web ACL, logging, etc., here.
    });

    // If using OAC, CDK handles bucket policy. If using OAI, attach bucket policy manually:
    // staticBucket.addToResourcePolicy(new iam.PolicyStatement({
    //   actions: ['s3:GetObject'],
    //   resources: [staticBucket.arnForObjects('*')],
    //   principals: [new iam.CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    // }));

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.distributionDomainName,
    });
  }
}
