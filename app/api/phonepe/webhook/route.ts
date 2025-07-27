// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe\webhook\route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma/prisma';
// NO LONGER NEEDED: import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // --- 1. Extract Headers and Body ---
    const phonepeXVerifyHeader = req.headers.get('X-VERIFY');
    const body = await req.json();
    const base64Response = body.response;

    // --- 2. Verify the Checksum (Security Check) ---
    const saltKey = process.env.PHONEPE_SALT_KEY!;
    const saltIndex = process.env.PHONEPE_SALT_INDEX!;

    const stringToHash = `${base64Response}${saltKey}`;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const calculatedChecksum = `${sha256}###${saltIndex}`;

    if (calculatedChecksum !== phonepeXVerifyHeader) {
      console.error('PhonePe Webhook: Checksum mismatch! Potentially fraudulent request.');
      return NextResponse.json({ success: false, message: 'Request integrity check failed.' }, { status: 401 });
    }

    // --- 3. Decode the Response and Process Payment ---
    const decodedResponse = Buffer.from(base64Response, 'base64').toString('utf-8');
    const responsePayload = JSON.parse(decodedResponse);

    const merchantTransactionId = responsePayload.data.merchantTransactionId;
    const paymentStatus = responsePayload.code;

    // --- 4. Find the Original Transaction in Our Database ---
    const paymentRecord = await prisma.payment.findUnique({
        where: { providerPaymentId: merchantTransactionId },
        include: { User: true }
    });

    if (!paymentRecord) {
        console.error(`PhonePe Webhook: No payment record found for transaction ID: ${merchantTransactionId}`);
        return NextResponse.json({ success: true, message: 'Acknowledged, but no record found.' });
    }

    // --- 5. Update Database Based on Payment Status ---
    if (paymentRecord.status !== 'PENDING') {
        console.log(`PhonePe Webhook: Transaction ${merchantTransactionId} already processed.`);
        return NextResponse.json({ success: true, message: 'Already processed.' });
    }
    
    if (paymentStatus === 'PAYMENT_SUCCESS') {
        const amountPaid = paymentRecord.amount;
        const creditsToAdd = Math.floor(amountPaid); 

        // THE FIX: Remove the explicit type. TypeScript will now infer the correct
        // Accelerate-aware transaction client type automatically.
        await prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { id: paymentRecord.id },
                data: { 
                    status: 'COMPLETED',
                    paymentMethod: `${responsePayload.data.paymentInstrument.type}`
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

        console.log(`Successfully processed payment and credited account for transaction ${merchantTransactionId}`);

    } else {
        await prisma.payment.update({
            where: { id: paymentRecord.id },
            data: { status: 'FAILED' },
        });
        console.log(`Payment failed for transaction ${merchantTransactionId}. Status: ${paymentStatus}`);
    }

    // --- 6. Acknowledge Receipt to PhonePe ---
    return NextResponse.json({ success: true, message: 'Webhook processed successfully.' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error processing PhonePe webhook:', errorMessage);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}