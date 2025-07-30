// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\payment\status\route.ts
// This is a NEW helper file to handle the POST redirect from PhonePe.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // PhonePe sends the transaction data in the form body
    const formData = await req.formData();
    const transactionId = formData.get('merchantTransactionId') as string;

    // The base URL of your frontend status page
    const redirectBaseUrl = new URL('/user/payment/status', req.url);

    if (transactionId) {
      // Add the transactionId as a query parameter
      redirectBaseUrl.searchParams.set('transactionId', transactionId);
    } else {
        // Handle case where transactionId is missing
        redirectBaseUrl.searchParams.set('error', 'missing_txn_id');
    }

    // Redirect the user's browser to the new URL (e.g., /user/payment/status?transactionId=...)
    return NextResponse.redirect(redirectBaseUrl);

  } catch (error) {
    console.error("Error in POST-to-GET redirect handler:", error);
    const errorRedirectUrl = new URL('/user/payment/status', req.url);
    errorRedirectUrl.searchParams.set('error', 'processing_failed');
    return NextResponse.redirect(errorRedirectUrl);
  }
}