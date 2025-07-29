// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\phonepe-sdk-button.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    // The new SDK uses the PhonePeCheckout object
    PhonePeCheckout?: {
      open: (options: any) => void;
      close: () => void;
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
    // Check for the new object
    if (!sdkReady || typeof window.PhonePeCheckout === 'undefined') {
      console.error("handlePayment called before PhonePeCheckout SDK was ready.");
      alert("Payment gateway is not available. Please refresh and try again.");
      return;
    }
    
    if (amount <= 0) {
      alert("Invalid Amount: Payment amount must be greater than zero.");
      return;
    }

    setIsProcessing(true);
    try {
      // This backend API call now needs to do more. 
      // It should return the full response from PhonePe's /pg/v1/pay API.
      const response = await fetch('/api/phonepe-js/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      // We expect the full payload from the backend now
      if (data.success && data.instrumentResponse) {
        
        // The new SDK method is .open()
        window.PhonePeCheckout.open({
          "instrumentResponse": data.instrumentResponse, // Pass the instrumentResponse
          "merchantId": data.merchantId,
          "callback": function (response: any) {
            console.log("PhonePe Callback Response:", response);
            if (response.code === 'PAYMENT_SUCCESS') {
              // On success, redirect to your status page
              window.location.href = `/user/payment/status?orderId=${response.merchantTransactionId}`;
            } else {
              // Handle other statuses (e.g., PAYMENT_ERROR, PAYMENT_PENDING, etc.)
              alert(`Payment did not complete. Status: ${response.code}`);
              setIsProcessing(false);
              window.PhonePeCheckout?.close(); // Close the popup on failure
            }
          }
        });

      } else {
        console.error('Failed to get payment instrument from backend:', data.error);
        alert(`Could not initiate payment: ${data.error || "Unknown server error."}`);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('An error occurred during payment setup:', error);
      alert("Client-Side Error: Could not connect to the payment server.");
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = !sdkReady || isProcessing;

  return (
    <Button
      onClick={handlePayment}
      disabled={isButtonDisabled}
      className="w-full"
    >
      {isProcessing ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
      ) : !sdkReady ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Initializing Gateway...</>
      ) : (
        'Pay Now'
      )}
    </Button>
  );
}