// components/phonepe-sdk-button.tsx
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface PhonePeCallbackResponse {
  code: 'PAYMENT_SUCCESS' | 'PAYMENT_ERROR' | 'PAYMENT_PENDING' | string;
  merchantTransactionId: string;
}

declare global {
  interface Window {
    PhonePeCheckout?: {
      transact: (options: {
        tokenUrl: string;
        type?: 'REDIRECT' | 'IFRAME';
        callback?: (response: PhonePeCallbackResponse) => void;
      }) => void;
      closePage: () => void;
    };
  }
}

interface PhonePeSDKButtonProps {
  amount: number;
  sdkReady: boolean;
}

export function PhonePeSDKButton({ amount, sdkReady }: PhonePeSDKButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!sdkReady || typeof window.PhonePeCheckout?.transact !== 'function') {
      console.error("SDK not ready or transact() unavailable");
      alert("Payment gateway is not available. Please refresh and try again.");
      return;
    }

    if (amount <= 0) {
      alert("Invalid Amount: Payment amount must be greater than zero.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/phonepe-js/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();

      if (data.success && data.instrumentResponse?.redirectInfo?.url) {
        const tokenUrl = data.instrumentResponse.redirectInfo.url;

        window.PhonePeCheckout.transact({
          tokenUrl,
          type: data.type || 'REDIRECT',
          callback: (callbackResponse) => {
            if (callbackResponse.code === 'PAYMENT_SUCCESS') {
              alert("Payment Successful! Redirecting you to your reports...");
              window.location.href = `/user/all-reports?transactionId=${encodeURIComponent(callbackResponse.merchantTransactionId)}`;
            } else {
              alert(`Payment Not Completed. Status: ${callbackResponse.code}`);
              setIsProcessing(false);
              window.PhonePeCheckout?.closePage();
            }
          }
        });
      } else {
        console.error('Backend failed to create payment session:', data.error);
        alert(`Server Error: Could not initiate payment. ${data.error || "Unknown error."}`);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Client-side error during payment setup:', err);
      alert("Client-Side Error: Could not connect to the payment server.");
      setIsProcessing(false);
    }
  };

  const disabled = !sdkReady || isProcessing;
  return (
    <Button onClick={handlePayment} disabled={disabled} className="w-full text-lg py-6" size="lg">
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processing...
        </>
      ) : !sdkReady ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading Gateway...
        </>
      ) : (
        'Subscribe Now'
      )}
    </Button>
  );
}
