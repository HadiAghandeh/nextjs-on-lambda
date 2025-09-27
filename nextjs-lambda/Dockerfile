# syntax=docker/dockerfile:1.4
# This is a multi-stage build to create a lightweight production image.

# 1. Build Stage: Install dependencies and build the Next.js app.
FROM public.ecr.aws/docker/library/node:20-slim as builder

# Set the working directory for the build process.
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies.
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install dependencies.
RUN \
  if [ -f "yarn.lock" ]; then yarn --frozen-lockfile; \
  elif [ -f "pnpm-lock.yaml" ]; then yarn; \
  else npm ci; \
  fi

# Copy the rest of the application source code.
COPY . .

# Disable telemetry to reduce image size and build time.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application for production.
RUN npm run build

# 2. Runner Stage: Create the final production image.
FROM public.ecr.aws/docker/library/node:20-slim as runner

# Set the working directory for the runner.
WORKDIR /app

# Copy the standalone output from the builder stage.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy the AWS Lambda Web Adapter binary into the container.
# This adapter translates API Gateway/Lambda requests into HTTP requests for our Next.js server.
# It is essential for making the Next.js server runnable on AWS Lambda.
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# Set the environment variables required by the adapter.
# The adapter will expose port 8080, which is the port our Next.js server will run on.
ENV AWS_LAMBDA_EXEC_WRAPPER=/opt/extensions/lambda-adapter
ENV PORT=8080

# This command starts the Next.js server using the standalone entry point.
CMD ["node", "server.js"]
