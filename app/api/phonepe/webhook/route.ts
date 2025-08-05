// pages/api/phonepe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StandardCheckoutClient, CallbackResponse, PhonePeException, Env } from 'pg-sdk-node';
import crypto from 'crypto';

const USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME!;
const PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD!;

// Initialize the PhonePe SDK client
const client = StandardCheckoutClient.getInstance(
  process.env.PHONEPE_CLIENT_ID!,
  process.env.PHONEPE_CLIENT_SECRET!,
  parseInt(process.env.PHONEPE_CLIENT_VERSION!, 10),
  process.env.PHONEPE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX
);

export async function POST(req: NextRequest): Promise<NextResponse<{ received?: boolean; error?: string }>> {
  const auth = req.headers.get('authorization') ?? '';
  console.debug('🔐 Received Authorization header:', auth);

  const bodyStr = await req.text();
  console.debug('📦 Raw webhook body:', bodyStr);

  let callbackResp: CallbackResponse;
  try {
    callbackResp = client.validateCallback(
      USERNAME,
      PASSWORD,
      auth,
      bodyStr
    );
    console.info('✅ Callback verified via SDK');
  } catch (error: unknown) {
    console.error('❌ Callback validation failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
  }

  console.debug('🧾 CallbackResponse:', callbackResp);

  const eventType = callbackResp.type;
  const payload = callbackResp.payload;
  const { merchantOrderId, orderId, state, amount } = payload;
  const paymentDetail = Array.isArray(payload.paymentDetails) ? payload.paymentDetails[0] : undefined;
  const transactionId = paymentDetail?.transactionId;

  console.info('🔔 Event type:', eventType);
  console.info('📬 Payload:', { merchantOrderId, orderId, state, amount, transactionId });

  // TODO: update your DB record using merchantOrderId and state

  return NextResponse.json({ received: true }, { status: 200 });
}
