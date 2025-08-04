'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface BackendSuccess {
  success: true;
  redirectUrl: string;
  orderId: string;
}

interface BackendError {
  success: false;
  error?: string;
  details?: string;
}

type BackendResponse = BackendSuccess | BackendError;

interface PhonePeSDKButtonProps {
  amount: number;
  sdkReady: boolean;
}

export function PhonePeSDKButton({ amount, sdkReady }: PhonePeSDKButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (isLoading) return;
    if (amount <= 0) {
      alert('Invalid Amount: Payment must be greater than ₹0.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/phonepe-js/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data: BackendResponse = await res.json();

      if (!data.success) {
        console.error('[PhonePe] Payment session failed:', data.error, data.details);
        alert(`Server Error: ${data.error ?? 'Payment setup failed'}`);
      } else if (!data.redirectUrl) {
        console.error('[PhonePe] Missing redirectUrl:', data);
        alert('Server Error: No payment link available.');
      } else {
        console.log('[PhonePe] Redirecting to:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('[PhonePe] Fetch error:', error);
      alert('Network Error: Could not reach payment server.');
    } finally {
      setIsLoading(false);
    }
  };

  const disabled = isLoading || !sdkReady;

  return (
    <Button onClick={handlePayment} disabled={disabled}>
      {isLoading
        ? 'Processing…'
        : sdkReady
        ? 'Subscribe Now'
        : 'Get Ready...'}
    </Button>
  );
}
