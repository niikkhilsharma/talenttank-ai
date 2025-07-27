// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\phonepe-button.tsx

'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react'; // Import the loader icon for a better UI

interface PhonePeButtonProps {
  amount: number;
}

export function PhonePeButton({ amount }: PhonePeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (amount <= 0) {
      alert("Invalid Amount: Payment amount must be greater than zero.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/phonepe/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: amount 
        }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        console.error('Failed to initiate PhonePe payment:', data.error);
        alert(`Payment Initiation Failed: ${data.error || "An unknown error occurred. Please try again."}`);
      }
    } catch (error) {
      console.error('An error occurred while setting up the payment:', error);
      alert("Client-Side Error: Could not connect to the server. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isLoading}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Pay Now' // --- THE CHANGE IS HERE ---
      )}
    </Button>
  );
}