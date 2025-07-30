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
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json({ success: false, error: 'Invalid amount provided.' }, { status: 400 });
        }

        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const saltKey = process.env.PHONEPE_CLIENT_SECRET;
        const callbackUrl = process.env.PHONEPE_WEBHOOK_URL;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        const saltIndex = 1;

        if (!merchantId || !saltKey || !callbackUrl || !appUrl) {
            console.error('CRITICAL: Missing required environment variables (Merchant ID, Salt Key, Webhook URL, or App URL).');
            return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
        }
        
        await prisma.payment.create({
            data: {
                amount: amount, status: 'PENDING', provider: "PHONEPE",
                providerPaymentId: merchantTransactionId, User: { connect: { id: session.user.id } }
            }
        });

        const paymentData = {
            merchantId: merchantId,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: session.user.id,
            amount: amount * 100, // Amount in paise
            redirectUrl: `${appUrl}/user/all-reports`, // Redirect user to a success/status page
            redirectMode: 'POST',
            callbackUrl: callbackUrl, // Webhook for server-to-server confirmation
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const payload = JSON.stringify(paymentData);
        const base64Payload = Buffer.from(payload).toString('base64');
        
        const apiEndpoint = '/pg/v1/pay';
        const phonePePayUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox${apiEndpoint}`;

        const stringToHash = base64Payload + apiEndpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = `${sha256}###${saltIndex}`;

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'accept': 'application/json' },
            body: JSON.stringify({ request: base64Payload }),
        };

        const response = await fetch(phonePePayUrl, requestOptions);
        const data = await response.json();

        if (data.success && data.data?.instrumentResponse) {
            console.log("PhonePe session created successfully!");
            return NextResponse.json({
                success: true,
                instrumentResponse: data.data.instrumentResponse,
                merchantId: data.merchantId,
                merchantTransactionId: data.data.merchantTransactionId
            });
        } else {
            console.error('PhonePe returned an error:', data);
            await prisma.payment.delete({ where: { providerPaymentId: merchantTransactionId } });
            return NextResponse.json({ success: false, error: `Payment failed: ${data.message}` }, { status: 500 });
        }

    } catch (error: unknown) {
        console.error('An internal server error occurred in the payment route:', error);
        await prisma.payment.delete({ where: { providerPaymentId: merchantTransactionId } }).catch(e => console.error("Failed to cleanup payment record:", e));
        return NextResponse.json({ success: false, error: 'Could not initiate payment. An internal server error occurred.' }, { status: 500 });
    }
}