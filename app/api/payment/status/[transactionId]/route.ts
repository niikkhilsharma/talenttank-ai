// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\payment\status\[transactionId]\route.ts
// --- CLEANED: Final version, points directly to the correct PhonePe test server ---

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/auth';
import prisma from '@/lib/prisma/prisma';

interface RouteParams {
    params: { transactionId: string; };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        const { transactionId } = params;

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
        }

        const paymentRecord = await prisma.payment.findUnique({ where: { providerPaymentId: transactionId } });

        if (!paymentRecord || paymentRecord.userId !== session.user.id) {
            return NextResponse.json({ success: false, error: 'Payment record not found or unauthorized.' }, { status: 404 });
        }

        if (paymentRecord.status !== 'PENDING') {
            return NextResponse.json({ success: true, status: paymentRecord.status, amount: paymentRecord.amount });
        }
        
        const merchantId = process.env.PHONEPE_MERCHANT_ID!;
        const saltKey = process.env.PHONEPE_CLIENT_SECRET!;
        const saltIndex = 1;

        const apiEndpoint = `/pg/v1/status/${merchantId}/${transactionId}`;
        const phonePeStatusUrl = `https://api-test.phonepe.com/apis/hermes${apiEndpoint}`;
        
        const stringToHash = apiEndpoint + saltKey;
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = `${sha256}###${saltIndex}`;
        
        const response = await fetch(phonePeStatusUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'X-MERCHANT-ID': merchantId,
                'accept': 'application/json',
            },
        });

        const data = await response.json();

        if (data.success && data.code === 'PAYMENT_SUCCESS') {
            const updatedPayment = await prisma.payment.update({
                where: { providerPaymentId: transactionId },
                data: { status: 'COMPLETED', paymentMethod: data.data.paymentInstrument?.type },
            });
            return NextResponse.json({ success: true, status: updatedPayment.status, amount: updatedPayment.amount });
        } else if (data.success && (data.code === 'PAYMENT_ERROR' || data.code === 'TRANSACTION_NOT_FOUND')) {
             await prisma.payment.update({ where: { providerPaymentId: transactionId }, data: { status: 'FAILED' } });
             return NextResponse.json({ success: true, status: 'FAILED', amount: paymentRecord.amount });
        }
        
        return NextResponse.json({ success: true, status: paymentRecord.status, amount: paymentRecord.amount });

    } catch (error: unknown) {
        if (error instanceof Error) console.error("Error fetching payment status:", error.message, error.stack);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}