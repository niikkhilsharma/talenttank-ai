// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe-js\payment\route.ts
// --- CLEANED: Final version, points directly to the correct PhonePe test server ---

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
        }

        const { amount } = await request.json();
        
        const merchantId = process.env.PHONEPE_MERCHANT_ID!;
        const saltKey = process.env.PHONEPE_CLIENT_SECRET!;
        const saltIndex = 1;
        
        const merchantTransactionId = `TT-TXN-${Date.now()}`;

        await prisma.payment.create({
            data: {
                amount: amount, status: 'PENDING', provider: "PHONEPE",
                providerPaymentId: merchantTransactionId,
                User: { connect: { id: session.user.id } }
            }
        });

        const paymentData = {
            merchantId: merchantId, merchantTransactionId: merchantTransactionId,
            merchantUserId: session.user.id, amount: amount * 100,
            redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/status`,
            redirectMode: 'POST', callbackUrl: process.env.PHONEPE_WEBHOOK_URL!,
            paymentInstrument: { type: 'PAY_PAGE' }
        };

        const payload = JSON.stringify(paymentData);
        const base64Payload = Buffer.from(payload).toString('base64');
        const apiEndpoint = '/pg/v1/pay';
        const stringToHash = base64Payload + apiEndpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = `${sha256}###${saltIndex}`;

        // This is the correct production-ready URL for the test environment.
        const phonePePayUrl = `https://api-test.phonepe.com/apis/hermes/pg/v1/pay`;

        const response = await fetch(phonePePayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'accept': 'application/json',
            },
            body: JSON.stringify({ request: base64Payload }),
        });
        
        const data = await response.json();

        if (data.success && data.data?.instrumentResponse) {
            return NextResponse.json({
                success: true, instrumentResponse: data.data.instrumentResponse,
                merchantId: merchantId, merchantTransactionId: merchantTransactionId
            });
        } else {
            console.error('PhonePe API call failed:', data);
            await prisma.payment.delete({ where: { providerPaymentId: merchantTransactionId } });
            return NextResponse.json({ success: false, error: data.message || 'PhonePe Error' }, { status: 500 });
        }

    } catch (error: unknown) {
        if (error instanceof Error) console.error('Internal Server Error:', error.message, error.stack);
        else console.error('An unknown error occurred:', error);
        return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
    }
}