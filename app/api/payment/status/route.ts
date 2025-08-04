// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\payment\status\route.ts
// This route handles the POST redirect from PhonePe and converts it to a GET
// redirect that the user's browser can handle, showing a proper status page.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // PhonePe sends the transaction data in the request body as form data
    const formData = await req.formData();
    
    const transactionId = formData.get('merchantTransactionId') as string;
    const code = formData.get('code') as string; // e.g., 'PAYMENT_SUCCESS'

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      // Fallback in case the environment variable is not set
      throw new Error("NEXT_PUBLIC_APP_URL is not defined in .env file");
    }

    // The base URL of your frontend status page (e.g., /user/all-reports or a dedicated status page)
    const redirectUrl = new URL('/user/all-reports', appUrl);

    // Append the transaction details as query parameters for the frontend to use
    if (transactionId) {
      redirectUrl.searchParams.set('transactionId', transactionId);
    }
    if (code) {
        redirectUrl.searchParams.set('status', code);
    }

    // Redirect the user's browser to the new URL
    // e.g., http://localhost:3000/user/all-reports?transactionId=...&status=PAYMENT_SUCCESS
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("Error in PhonePe redirect handler:", error);
    // Redirect to a generic error page if something goes wrong
    const errorRedirectUrl = new URL('/user/all-reports', process.env.NEXT_PUBLIC_APP_URL || req.url);
    errorRedirectUrl.searchParams.set('error', 'processing_failed');
    return NextResponse.redirect(errorRedirectUrl);
  }
}