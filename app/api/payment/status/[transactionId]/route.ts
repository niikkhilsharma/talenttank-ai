// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\payment\status\[transactionId]\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getLoggedInUser } from '@/lib/auth/session';
import prisma from '@/lib/prisma/prisma';

interface RouteParams {
    params: {
        transactionId: string;
    };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await getLoggedInUser();
        const { transactionId } = params;

        if (!user) {
            return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
        }

        if (!transactionId) {
            return NextResponse.json({ success: false, error: 'Transaction ID is required.' }, { status: 400 });
        }
        
        const paymentRecord = await prisma.payment.findUnique({
            where: {
                providerPaymentId: transactionId,
            },
        });

        if (!paymentRecord) {
            return NextResponse.json({ success: false, error: 'Payment record not found.' }, { status: 404 });
        }

        // Security check: Ensure the user requesting the status is the one who owns the payment
        if (paymentRecord.userId !== user.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
        }

        // Return the current status of the payment from our database
        return NextResponse.json({
            success: true,
            status: paymentRecord.status, // e.g., "PENDING", "COMPLETED", "FAILED"
            amount: paymentRecord.amount,
        });

    } catch (error) {
        console.error("Error fetching payment status:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}