export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { auth } from "@/auth";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    console.log("[PhonePe] Payment initiation started");

    /** Step 1: Authenticate user **/
    const session = await auth();
    if (!session?.user?.id) {
      console.error("[PhonePe] Not authenticated");
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    /** Step 2: Validate payment amount **/
    let amount: unknown;
    try {
      const body = await req.json();
      amount = body.amount;
    } catch (parseErr) {
      console.error("[PhonePe] Invalid request body:", parseErr);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      console.error("[PhonePe] Invalid amount:", amount);
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    /** Step 3: Generate unique merchantOrderId **/
    const merchantOrderId = `TT-TXN-${Date.now()}-${randomUUID().slice(0, 8)}`;

    /** Step 4: Initialize PhonePe V2 client **/
    const client = StandardCheckoutClient.getInstance(
      process.env.PHONEPE_CLIENT_ID!,
      process.env.PHONEPE_CLIENT_SECRET!,
      Number(process.env.PHONEPE_CLIENT_VERSION!),
      process.env.PHONEPE_ENV === "PRODUCTION" ? Env.PRODUCTION : Env.SANDBOX
    );

    /** Step 5: Build payment request **/
    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(numericAmount * 100)) // in paise
      .redirectUrl(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/status/${merchantOrderId}`)
      .build();

    /** Step 6: Store transaction as PENDING in database **/
    await prisma.payment.create({
      data: {
        amount: numericAmount,
        status: "PENDING",
        provider: "PHONEPE",
        providerPaymentId: merchantOrderId,
        User: { connect: { id: session.user.id } },
      },
    });

    /** Step 7: Send pay request to PhonePe **/
    const response = await client.pay(payRequest);

    if (!response?.redirectUrl) {
      console.error("[PhonePe] Missing redirectUrl from PhonePe response:", response);
      return NextResponse.json(
        {
          success: false,
          error: "PhonePe did not return redirectUrl. Payment session may have failed.",
        },
        { status: 500 }
      );
    }

    /** Step 8: Return checkout URL to client **/
    console.log("[PhonePe] Payment session created:", {
      orderId: merchantOrderId,
      redirectUrl: response.redirectUrl,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: response.redirectUrl,
      orderId: merchantOrderId,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[PhonePe] Payment initiation error:", error.message, error.stack);
      return NextResponse.json(
        {
          success: false,
          error: "Payment initiation failed",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.error("[PhonePe] Unknown error during payment initiation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
