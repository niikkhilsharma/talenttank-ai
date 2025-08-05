// pages/api/phonepe/status/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  StandardCheckoutClient,
  Env,
  OrderStatusResponse,
  PhonePeException,
} from 'pg-sdk-node';

type StatusResponseBody = {
  orderId?: string;
  state?: string;
  amount?: number;
  error?: string;
};

// Initialize the PhonePe SDK client
const client = StandardCheckoutClient.getInstance(
  process.env.PHONEPE_CLIENT_ID!,
  process.env.PHONEPE_CLIENT_SECRET!,
  parseInt(process.env.PHONEPE_CLIENT_VERSION!, 10),
  process.env.PHONEPE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX
);

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId?: string } }
): Promise<NextResponse<StatusResponseBody>> {
  const merchantOrderId = params.orderId;
  console.debug('📦 Received orderId:', merchantOrderId);

  if (!merchantOrderId) {
    console.error('❌ Missing orderId parameter');
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    console.debug('📬 Calling SDK for order status...');
    const resp: OrderStatusResponse = await client.getOrderStatus(merchantOrderId, false); // 👈 fixed here

    console.debug('📨 PhonePe SDK response:', resp);

    const { state, amount, orderId } = resp;
    console.info(`✅ Status for ${merchantOrderId}:`, state, '| Amount:', amount);

    return NextResponse.json({ orderId, state, amount }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof PhonePeException) {
      console.error('📛 PhonePeException:', {
        code: error.code,
        message: error.message,
        statusCode: error.httpStatusCode,
        data: error.data,
      });
      return NextResponse.json(
        { error: `${error.code}: ${error.message}` },
        { status: error.httpStatusCode ?? 500 }
      );
    }

    console.error('🔥 Unexpected error:', error);
    const msg =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: unknown }).message
        : JSON.stringify(error);
    const errorMessage = typeof msg === 'string' ? msg : JSON.stringify(msg);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
