// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\api\phonepe-js\payment\route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const saltKey = process.env.PHONEPE_CLIENT_SECRET; // This MUST be your Salt Key
        const saltIndex = 1;

        if (!merchantId || !saltKey) {
            console.error("CRITICAL: Missing PhonePe credentials in .env file. Check PHONEPE_MERCHANT_ID and PHONEPE_CLIENT_SECRET (as Salt Key).");
            return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
        }

        const main: any = {
            merchantId: merchantId,
            merchantTransactionId: `MTID-${Date.now()}`,
            merchantUserId: `MUID-${Date.now()}`,
            amount: amount * 100,
            redirectUrl: process.env.PHONEPE_RETURN_URL,
            redirectMode: 'POST',
            callbackUrl: process.env.PHONEPE_WEBHOOK_URL,
            mobileNumber: '9999999999',
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        const payload = JSON.stringify(main);
        const base64Payload = Buffer.from(payload).toString('base64');
        
        // --- THE FINAL FIX ---
        // The API endpoint for the HASH is the original path, without the server's routing prefix.
        const apiEndpointForHash = '/pg/v1/pay';
        const stringToHash = `${base64Payload}${apiEndpointForHash}${saltKey}`;
        
        const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
        const xVerify = `${sha256}###${saltIndex}`;

        // The URL we send the request to IS the full path.
        const phonePePayUrl = `https://api-preprod.phonepe.com/apis/pg-web/pg/v1/pay`;

        const response = await fetch(phonePePayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': xVerify,
                'accept': 'application/json',
            },
            body: JSON.stringify({
                request: base64Payload,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("PhonePe API failed with status:", response.status);
            console.error("START OF PHONEPE ERROR RESPONSE");
            console.error(errorText);
            console.error("END OF PHONEPE ERROR RESPONSE");
            return NextResponse.json({ success: false, error: "PhonePe rejected the request. Check server logs for details." }, { status: 500 });
        }
        
        const data = await response.json();

        if (data.success && data.data && data.data.instrumentResponse) {
            console.log("Successfully created payment session with PhonePe!");
            return NextResponse.json({
                success: true,
                instrumentResponse: data.data.instrumentResponse,
                merchantId: main.merchantId,
            });
        } else {
            console.error('PhonePe API returned a JSON error:', data);
            return NextResponse.json({ success: false, error: data.message || 'An unknown error occurred with PhonePe' }, { status: 500 });
        }

    } catch (error) {
        console.error('Internal Server Error (our code):', error);
        return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
    }
}