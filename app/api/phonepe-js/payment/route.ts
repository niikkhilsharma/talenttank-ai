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
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;
        const callbackUrl = process.env.PHONEPE_WEBHOOK_URL;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;

        // ======================= DEBUGGING BLOCK =======================
        // This will print the values to your server console (the terminal running `npm run dev`)
        console.log("--- DEBUGGING PHONEPE CREDENTIALS ---");
        console.log("MERCHANT_ID:", merchantId);
        console.log("SALT_KEY:", saltKey);
        console.log("SALT_INDEX:", saltIndex);
        console.log("CALLBACK_URL:", callbackUrl);
        console.log("---------------------------------------");
        // ===============================================================

        if (!merchantId || !saltKey || !saltIndex || !callbackUrl || !appUrl) {
            console.error('CRITICAL: Missing required environment variables. Check the debug logs above.');
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
            amount: amount * 100,
            redirectUrl: `${appUrl}/payment/status/${merchantTransactionId}`,
            redirectMode: 'POST',
            callbackUrl: callbackUrl,
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const payload = JSON.stringify(paymentData);
        const base64Payload = Buffer.from(payload).toString('base64');
        
        const apiEndpoint = '/pg/v1/pay';
        const stringToHash = base64Payload + apiEndpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = `${sha256}###${saltIndex}`;

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify, 'accept': 'application/json' },
            body: JSON.stringify({ request: base64Payload }),
        };
        
        const phonePePayUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox${apiEndpoint}`;

        const response = await fetch(phonePePayUrl, requestOptions);
        const data = await response.json();

        if (data.success && data.data?.instrumentResponse) {
            return NextResponse.json(data);
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