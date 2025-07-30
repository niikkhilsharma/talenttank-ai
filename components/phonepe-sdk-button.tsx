// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\phonepe-sdk-button.tsx
// --- FINAL VERSION: NO 'any', NO 'toast', USES 'alert()' ---

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

// --- Type Definitions for PhonePe Objects ---

interface PhonePeCallbackResponse {
  code: 'PAYMENT_SUCCESS' | 'PAYMENT_ERROR' | 'PAYMENT_PENDING' | string;
  merchantTransactionId: string;
}

// FIX 1: Replaced 'any' with a specific type for the instrument response.
interface PhonePeInstrumentResponse {
  type: 'PAY_PAGE';
  redirectInfo: {
    url: string;
    method: string;
  };
}

interface PhonePeCheckoutOptions {
  instrumentResponse: PhonePeInstrumentResponse; // Now strongly typed
  merchantId: string;
  callback: (response: PhonePeCallbackResponse) => void;
}

declare global {
  interface Window {
    PhonePeCheckout?: {
      open: (options: PhonePeCheckoutOptions) => void;
      close: () => void;
    };
  }
}

// --- Component Definition ---

interface PhonePeSDKButtonProps {
  amount: number;
  sdkReady: boolean;
}

export function PhonePeSDKButton({ amount, sdkReady }: PhonePeSDKButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  // FIX 2: Removed 'useToast' hook.

  const handlePayment = async () => {
    if (!sdkReady || typeof window.PhonePeCheckout === 'undefined') {
      console.error("SDK not ready or PhonePeCheckout object not found.");
      alert("Payment gateway is not available. Please refresh and try again."); // Using alert
      return;
    }
    
    if (amount <= 0) {
      alert("Invalid Amount: Payment amount must be greater than zero."); // Using alert
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/phonepe-js/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.success && data.instrumentResponse) {
        window.PhonePeCheckout.open({
          instrumentResponse: data.instrumentResponse,
          merchantId: data.merchantId,
          callback: function (callbackResponse) {
            if (callbackResponse.code === 'PAYMENT_SUCCESS') {
              alert("Payment Successful! Redirecting you to your reports..."); // Using alert
              window.location.href = `/user/all-reports?transactionId=${data.merchantTransactionId}`;
            } else {
              alert(`Payment Not Completed. Status: ${callbackResponse.code}`); // Using alert
              setIsProcessing(false);
              window.PhonePeCheckout?.close();
            }
          }
        });

      } else {
        console.error('Backend failed to create payment session:', data.error);
        alert(`Server Error: Could not initiate payment. ${data.error || "Unknown error."}`); // Using alert
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Client-side error during payment setup:', error);
      alert("Client-Side Error: Could not connect to the payment server."); // Using alert
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = !sdkReady || isProcessing;

  return (
    <Button
      onClick={handlePayment}
      disabled={isButtonDisabled}
      className="w-full text-lg py-6"
      size="lg"
    >
      {isProcessing ? (
        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
      ) : !sdkReady ? (
        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading Gateway...</>
      ) : (
        'Subscribe Now'
      )}
    </Button>
  );
}