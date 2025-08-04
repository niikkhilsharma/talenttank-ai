// app/api/phonepe-js/payment/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma/prisma';
import { auth } from '@/auth';

// 👇 POST /api/phonepe-js/payment
export async function POST(request: Request) {
  const merchantTransactionId = `TT-TXN-${Date.now()}`;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
    }

    const { amount } = await request.json();
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;
    const callbackUrl = process.env.PHONEPE_WEBHOOK_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!merchantId || !saltKey || !saltIndex || !callbackUrl || !appUrl) {
      console.error('CRITICAL: Missing required environment variables.');
      return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
    }

    await prisma.payment.create({
      data: {
        amount,
        status: 'PENDING',
        provider: 'PHONEPE',
        providerPaymentId: merchantTransactionId,
        User: { connect: { id: session.user.id } },
      },
    });

    const paymentData = {
      merchantId,
      merchantTransactionId,
      merchantUserId: session.user.id,
      amount: amount * 100, // in paise
      redirectUrl: `${appUrl}/api/payment/status`,
      redirectMode: 'POST',
      callbackUrl,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const payload = JSON.stringify(paymentData);
    const base64Payload = Buffer.from(payload, 'utf8').toString('base64');
    const apiEndpoint = '/pg/v1/pay';
    const verifyString = base64Payload + apiEndpoint + saltKey;
    const sha256 = crypto.createHash('sha256').update(verifyString).digest('hex');
    const xVerify = `${sha256}###${saltIndex}`;

    const resp = await fetch(`https://api-preprod.phonepe.com/apis/pg-sandbox${apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
        'X-VERIFY': xVerify,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const dataFromPhonePe = await resp.json();

    if (dataFromPhonePe.success && dataFromPhonePe.data?.instrumentResponse) {
      return NextResponse.json({
        success: true,
        instrumentResponse: dataFromPhonePe.data.instrumentResponse,
        merchantId: dataFromPhonePe.data.merchantId,
        merchantTransactionId: dataFromPhonePe.data.merchantTransactionId,
      });
    } else {
      await prisma.payment.delete({ where: { providerPaymentId: merchantTransactionId } });
      console.error('PhonePe error:', dataFromPhonePe);
      return NextResponse.json(
        { success: false, error: `Payment initiation failed: ${dataFromPhonePe.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    await prisma.payment.deleteMany({ where: { providerPaymentId: merchantTransactionId } }).catch(e =>
      console.error('Cleanup failed:', e)
    );
    console.error('Internal server error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not initiate payment. Internal server error.' },
      { status: 500 }
    );
  }
}
