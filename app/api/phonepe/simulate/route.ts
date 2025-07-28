// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe\simulate\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getLoggedInUser } from '@/lib/auth/session';
import prisma from '@/lib/prisma/prisma';
import { PaymentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  // IMPORTANT: This is a developer-only route and should be protected or removed in production.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'This endpoint is not available in production.' }, { status: 403 });
  }

  try {
    const { amount }: { amount: number } = await req.json();
    const user = await getLoggedInUser();

    if (!user) {
        return NextResponse.json({ success: false, error: 'User not authenticated.' }, { status: 401 });
    }
    
    console.log(`--- SIMULATING a successful payment of ₹${amount} for user ${user.email} ---`);

    const simulatedTransactionId = `SIM-TXN-${uuidv4()}`;
    const creditsToAdd = Math.floor(amount);

    // Use a Prisma transaction to ensure both User and Payment are updated together safely.
    await prisma.$transaction(async (tx) => {
        // Create a a new payment record with a COMPLETED status.
        await tx.payment.create({
            data: {
                amount: amount,
                userId: user.id,
                status: PaymentStatus.COMPLETED,
                provider: 'PHONEPE_SIMULATED',
                providerPaymentId: simulatedTransactionId,
                paymentMethod: 'TEST_MODE'
            }
        });

        // Directly update the User's credits and payment total.
        await tx.user.update({
            where: { id: user.id },
            data: {
                totalCredits: { increment: creditsToAdd },
                remainingCredits: { increment: creditsToAdd },
                totalPaymentMade: { increment: amount },
            },
        });
    });

    console.log(`--- SIMULATION COMPLETE. User ${user.email} has been credited.`);

    // Return a success response
    return NextResponse.json({ success: true, message: `Successfully simulated payment and credited ${creditsToAdd} credits.` });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in payment simulation:', errorMessage);
    return NextResponse.json({ success: false, error: 'Internal Server Error during simulation.' }, { status: 500 });
  }
}