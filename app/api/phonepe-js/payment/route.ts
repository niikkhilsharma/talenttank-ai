// app/api/phonepe-js/payment/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma/prisma';
import { auth } from '@/auth';

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
            console.error('CRITICAL: Missing required environment variables from .env file.');
            return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
        }
        
        await prisma.payment.create({
            data: { amount, status: 'PENDING', provider: "PHONEPE", providerPaymentId: merchantTransactionId, User: { connect: { id: session.user.id } } }
        });

        const paymentData = {
            merchantId, merchantTransactionId, merchantUserId: session.user.id, amount: amount * 100,
            redirectUrl: `${appUrl}/api/payment/status`, redirectMode: 'POST', callbackUrl,
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const payload = JSON.stringify(paymentData);
        const base64Payload = Buffer.from(payload).toString('base64');
        const apiEndpoint = '/pg/v1/pay';
        const stringToHash = base64Payload + apiEndpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = `${sha256}###${saltIndex}`;

        const response = await fetch(`https://api-preprod.phonepe.com/apis/pg-sandbox${apiEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'accept': 'application/json' },
            body: JSON.stringify({ request: base64Payload }),
        });

        const dataFromPhonePe = await response.json();

        // This constructs the exact response object the frontend SDK button needs
        if (dataFromPhonePe.success && dataFromPhonePe.data?.instrumentResponse) {
            return NextResponse.json({
                success: true,
                instrumentResponse: dataFromPhonePe.data.instrumentResponse,
                merchantId: dataFromPhonePe.data.merchantId,
                merchantTransactionId: dataFromPhonePe.data.merchantTransactionId
            });
        } else {
            await prisma.payment.delete({ where: { providerPaymentId: merchantTransactionId } });
            return NextResponse.json({ success: false, error: `Payment failed: ${dataFromPhonePe.message}` }, { status: 500 });
        }
    } catch (error) {
        await prisma.payment.deleteMany({ where: { providerPaymentId: merchantTransactionId } }).catch(e => console.error("Failed to cleanup payment record:", e));
        return NextResponse.json({ success: false, error: 'Could not initiate payment. An internal server error occurred.' }, { status: 500 });
    }
}