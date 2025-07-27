// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe\payment\route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getLoggedInUser } from '@/lib/auth/session';
import prisma from '@/lib/prisma/prisma';
import { PaymentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  // --- UNDENIABLE PROOF OF EXECUTION ---
  console.log(`\n\n--- [${new Date().toISOString()}] SERVER IS RUNNING THE LATEST CODE. --- \n\n`);

  try {
    const { amount }: { amount: number } = await req.json();
    const user = await getLoggedInUser();

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
    }
    // ... the rest of the code is the same correct version ...
    if (!user.phoneNumber) {
        return NextResponse.json({ success: false, error: 'User phone number is missing.' }, { status: 400 });
    }
    
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;
    if (!merchantId || !saltKey || !saltIndex || merchantId === 'YOUR_MERCHANT_ID_HERE') {
        console.error("PhonePe environment variables are not set correctly.");
        return NextResponse.json({ success: false, error: 'Server payment configuration is incomplete.' }, { status: 500 });
    }
    
    const amountInPaisa = Math.round(amount * 100);
    const merchantTransactionId = `TXN-${uuidv4()}`;

    await prisma.payment.create({
        data: {
            amount: amount, 
            userId: user.id,
            status: PaymentStatus.PENDING, 
            provider: 'PHONEPE',
            providerPaymentId: merchantTransactionId,
        }
    });

    const paymentData = {
      merchantId, merchantTransactionId,
      merchantUserId: user.id,
      amount: amountInPaisa,
      redirectUrl: process.env.PHONEPE_REDIRECT_URL!,
      redirectMode: 'POST',
      callbackUrl: process.env.PHONEPE_WEBHOOK_URL!,
      mobileNumber: user.phoneNumber,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const payload = JSON.stringify(paymentData);
    const payloadBase64 = Buffer.from(payload).toString('base64');
    const stringToHash = `${payloadBase64}/pg/v1/pay${saltKey}`;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = `${sha256}###${saltIndex}`;

    const phonepeApiUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';
    const response = await fetch(phonepeApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum, 'accept': 'application/json' },
      body: JSON.stringify({ request: payloadBase64 }),
    });

    const data = await response.json();

    if (data.success && data.code === 'PAYMENT_INITIATED') {
      return NextResponse.json({ success: true, redirectUrl: data.data.instrumentResponse.redirectInfo.url });
    } else {
      console.error('PhonePe API Error:', data.message);
      await prisma.payment.updateMany({ where: { providerPaymentId: merchantTransactionId }, data: { status: PaymentStatus.FAILED } });
      return NextResponse.json({ success: false, error: data.message || 'Failed to initiate payment at PhonePe.' }, { status: 500 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Internal Server Error in PhonePe payment initiation:\n', errorMessage);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}