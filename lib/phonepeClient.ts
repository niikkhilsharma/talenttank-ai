// lib/phonepeClient.ts

import { StandardCheckoutClient, Env } from 'pg-sdk-node';

declare global {
  // eslint-disable-next-line no-var
  var phonePeClient: StandardCheckoutClient | undefined;
}

export function getPhonePeClient(): StandardCheckoutClient {
  if (!globalThis.phonePeClient) {
    console.log('🚀 Initializing PhonePe Client...');
    globalThis.phonePeClient = StandardCheckoutClient.getInstance(
      process.env.PHONEPE_CLIENT_ID!,
      process.env.PHONEPE_CLIENT_SECRET!,
      parseInt(process.env.PHONEPE_CLIENT_VERSION!, 10),
      process.env.PHONEPE_ENV?.toLowerCase() === 'production' ? Env.PRODUCTION : Env.SANDBOX
    );
  }
  return globalThis.phonePeClient;
}
