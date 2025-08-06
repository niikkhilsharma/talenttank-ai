import { StandardCheckoutClient, Env } from 'pg-sdk-node';

let phonePeClient: StandardCheckoutClient | null = null;

export function getPhonePeClient() {
  if (!phonePeClient) {
    console.log("🚀 Initializing PhonePe Client");
    phonePeClient = StandardCheckoutClient.getInstance(
      process.env.PHONEPE_CLIENT_ID!,
      process.env.PHONEPE_CLIENT_SECRET!,
      parseInt(process.env.PHONEPE_CLIENT_VERSION!, 10),
      process.env.PHONEPE_ENV?.toLowerCase() === 'production' ? Env.PRODUCTION : Env.SANDBOX
    );
  }
  return phonePeClient;
}
