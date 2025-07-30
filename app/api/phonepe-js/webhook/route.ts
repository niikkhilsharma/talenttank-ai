// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe-js\webhook\route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma/prisma';
import { PaymentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { response: base64Body } = await req.json();
    const signature = req.headers.get("x-verify");

    if (!base64Body || !signature) {
        console.error("PhonePe Webhook: Missing response body or X-VERIFY signature.");
        return NextResponse.json({ success: false, message: 'Missing body or signature' }, { status: 400 });
    }

    const saltKey = process.env.PHONEPE_CLIENT_SECRET!;
    const saltIndex = 1;

    const calculatedSignature = crypto.createHash('sha256').update(base64Body + saltKey).digest('hex') + `###${saltIndex}`;

    if (calculatedSignature !== signature) {
        console.error("PhonePe Webhook: Invalid signature.");
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    const decodedBody = JSON.parse(Buffer.from(base64Body, 'base64').toString('utf-8'));
    const merchantTransactionId = decodedBody.data.merchantTransactionId;
    const transactionStatus = decodedBody.code;

    console.log(`Webhook received for transaction: ${merchantTransactionId} with status: ${transactionStatus}`);

    const paymentRecord = await prisma.payment.findUnique({
        where: { providerPaymentId: merchantTransactionId },
    });

    if (!paymentRecord) {
        console.error(`PhonePe Webhook: No payment record found for transaction ID: ${merchantTransactionId}`);
        return NextResponse.json({ success: true, message: 'Acknowledged, but no record found.' });
    }

    if (paymentRecord.status !== 'PENDING') {
        console.log(`PhonePe Webhook: Transaction ${merchantTransactionId} already processed. Status: ${paymentRecord.status}.`);
        return NextResponse.json({ success: true, message: 'Already processed.' });
    }
    
    if (transactionStatus === 'PAYMENT_SUCCESS') {
        const amountPaid = paymentRecord.amount;
        const creditsToAdd = Math.floor(amountPaid);

        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentRecord.id },
                data: { 
                    status: PaymentStatus.COMPLETED,
                    paymentMethod: decodedBody.data.paymentInstrument.type 
                },
            });
            await tx.user.update({
                where: { id: paymentRecord.userId },
                data: {
                    totalCredits: { increment: creditsToAdd },
                    remainingCredits: { increment: creditsToAdd },
                    totalPaymentMade: { increment: amountPaid },
                },
            });
        });
        console.log(`Successfully processed PAYMENT_SUCCESS for transaction ${merchantTransactionId}`);

    } else {
        await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: PaymentStatus.FAILED },
        });
        console.log(`Payment failed for transaction ${merchantTransactionId}. Status: ${transactionStatus}`);
    }
    
    return NextResponse.json({ success: true, message: "Webhook received and processed successfully." });

  } catch (error: unknown) { // <-- CORRECTED TYPE
    // Type guard to safely access error properties
    if (error instanceof Error) {
        console.error('Error processing PhonePe webhook:', error.message, error.stack);
    } else {
        console.error('An unknown error occurred in the webhook:', error);
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}