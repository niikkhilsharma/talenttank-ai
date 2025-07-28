// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\test-payment-button.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2, Beaker } from 'lucide-react';

interface TestPaymentButtonProps {
  amount: number;
}

export function TestPaymentButton({ amount }: TestPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // This check ensures the component only renders in a development environment
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleTestPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/phonepe/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Success! ${data.message}\n\nThe page will now reload to reflect your new credit balance.`);
        window.location.reload();
      } else {
        console.error('Test payment failed:', data.error);
        alert(`Test Payment Failed: ${data.error || 'An unknown error occurred.'}`);
      }
    } catch (error) {
      console.error('An error occurred during the test payment:', error);
      alert('Client-Side Error: Could not connect to the simulation server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isDevelopment) {
    return null; // Don't render anything if not in development mode
  }

  return (
    <Button
      onClick={handleTestPayment}
      disabled={isLoading}
      variant="outline"
      className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Simulating...
        </>
      ) : (
        <>
          <Beaker className="mr-2 h-4 w-4" />
          Simulate Successful Payment
        </>
      )}
    </Button>
  );
}