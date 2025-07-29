// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe-js\webhook\route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma/prisma';
import { PaymentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const base64Body = await req.text(); // PhonePe sends the response as a Base64 string in the body
    const signature = req.headers.get("x-verify");

    if (!signature) {
        console.error("PhonePe JS SDK Webhook: Missing X-VERIFY signature header.");
        return NextResponse.json({ success: false, message: 'Missing signature' }, { status: 400 });
    }

    const clientSecret = process.env.PHONEPE_CLIENT_SECRET!;

    // --- 1. Verify the Webhook Signature (Security Check) ---
    // The signature for the webhook is calculated on the Base64 body + the Client Secret
    const calculatedSignature = crypto.createHash('sha256').update(base64Body + clientSecret).digest('hex');

    if (calculatedSignature !== signature) {
        console.error("PhonePe JS SDK Webhook: Invalid signature. Potentially fraudulent request.");
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 });
    }

    // --- 2. Decode the Body and Process the Webhook Data ---
    const decodedBody = Buffer.from(base64Body, 'base64').toString('utf-8');
    const webhookData = JSON.parse(decodedBody);

    const orderId = webhookData.merchantTransactionId;
    const transactionStatus = webhookData.code; // e.g., 'PAYMENT_SUCCESS', 'PAYMENT_ERROR'

    // --- 3. Find the Original Transaction in Our Database ---
    const paymentRecord = await prisma.payment.findUnique({
        where: { providerPaymentId: orderId },
    });

    if (!paymentRecord) {
        console.error(`PhonePe JS SDK Webhook: No payment record found for order ID: ${orderId}`);
        return NextResponse.json({ success: true, message: 'Acknowledged, but no record found.' });
    }

    if (paymentRecord.status !== 'PENDING') {
        console.log(`PhonePe JS SDK Webhook: Order ${orderId} already processed. Status is ${paymentRecord.status}.`);
        return NextResponse.json({ success: true, message: 'Already processed.' });
    }
    
    // --- 4. Update Database Based on Payment Status ---
    if (transactionStatus === 'PAYMENT_SUCCESS') {
        const amountPaid = paymentRecord.amount;
        const creditsToAdd = Math.floor(amountPaid);

        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentRecord.id },
                data: { status: PaymentStatus.COMPLETED, paymentMethod: webhookData.paymentInstrument.type },
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
        console.log(`Successfully processed PhonePe JS SDK payment for order ${orderId}`);

    } else {
        await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: PaymentStatus.FAILED },
        });
        console.log(`PhonePe JS SDK payment failed for order ${orderId}. Status: ${transactionStatus}`);
    }
    
    // --- 5. Acknowledge Receipt to PhonePe ---
    return NextResponse.json({ success: true, message: "Webhook received and processed." });

  } catch (error: any) {
    console.error('Error processing PhonePe JS SDK webhook:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}