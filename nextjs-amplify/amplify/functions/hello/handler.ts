import type { Schema } from '../../data/resource';

// The handler's type is inferred from the 'invokeHello' query definition
export const handler: Schema['invokeHello']['functionHandler'] = async (event) => {
  const { name } = event.arguments;
  return `Hello, ${name || 'Amplify User'}! This message is from your Lambda function.`;
};