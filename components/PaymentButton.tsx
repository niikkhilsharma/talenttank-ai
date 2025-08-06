'use client';

import { usePhonePePayment } from '@/app/_hooks/usePhonePePayment';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react'; // Assuming you're using next-auth
import { toast } from 'react-hot-toast';

export default function PaymentButton({ amount }: { amount: number }) {
  const { initiatePayment, loading, error } = usePhonePePayment();
  const { data: session, status } = useSession(); // get session info

  const handleClick = () => {
    if (!session) {
      toast.error('Please log in to make a payment.');
      return;
    }

    initiatePayment(amount);
  };

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
