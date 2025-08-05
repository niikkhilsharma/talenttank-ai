import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
  StandardCheckoutPayResponse,
  PhonePeException,
} from 'pg-sdk-node';

type PayResponseBody = {
  orderId?: string;
  redirectUrl?: string;
  error?: string;
};

const client = StandardCheckoutClient.getInstance(
  process.env.PHONEPE_CLIENT_ID!,
  process.env.PHONEPE_CLIENT_SECRET!,
  parseInt(process.env.PHONEPE_CLIENT_VERSION!, 10),
  process.env.PHONEPE_ENV === 'production' ? Env.PRODUCTION : Env.SANDBOX
);

export async function POST(
  req: NextRequest
): Promise<NextResponse<PayResponseBody>> {
  console.debug('📥 Incoming request headers:', Object.fromEntries(req.headers));
  let body: unknown;
  try {
    body = await req.json();
  } catch (parseErr: unknown) {
    console.error('⚠️ JSON parse error:', parseErr);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as { amount?: unknown }).amount !== 'number'
  ) {
    console.error('🚫 Invalid body or missing amount:', body);
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const amount = (body as { amount: number }).amount;
  if (amount <= 0) {
    console.error('🚫 Amount must be >0:', amount);
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const merchantOrderId = `ORDER_${randomUUID()}`;
  console.debug('🆔 merchantOrderId generated:', merchantOrderId);

  const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;
  const payRequest = StandardCheckoutPayRequest.builder()
    .merchantOrderId(merchantOrderId)
    .amount(Math.floor(amount * 100)) // converts to paise
    .redirectUrl(redirectUrl)
    .build();

  console.debug('📬 Request built:', payRequest);

  try {
    const resp: StandardCheckoutPayResponse = await client.pay(payRequest);
    console.debug('📨 SDK response:', resp);

    if (!resp.redirectUrl || typeof resp.redirectUrl !== 'string') {
      console.error('❌ redirectUrl missing or wrong type in response:', resp);
      return NextResponse.json({ error: 'Missing redirectUrl' }, { status: 500 });
    }

    console.info('✅ Payment initiated:', merchantOrderId, '→', resp.redirectUrl);
    return NextResponse.json(
      { orderId: merchantOrderId, redirectUrl: resp.redirectUrl },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof PhonePeException) {
      console.error(
        '📛 PhonePeException:',
        'statusCode=',
        error.httpStatusCode,
        'code=',
        error.code,
        'message=',
        error.message,
        'data=',
        error.data
      );
      return NextResponse.json(
        { error: `${error.code}: ${error.message}` },
        { status: error.httpStatusCode ?? 500 }
      );
    }
    /// errors log

    console.error('🔥 Unexpected error during pay:', error);
    const msg =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: unknown }).message
        : JSON.stringify(error);
    const messageString = typeof msg === 'string' ? msg : JSON.stringify(msg);
    return NextResponse.json({ error: messageString }, { status: 500 });
  }
}
