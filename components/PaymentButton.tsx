'use client';

import { usePhonePePayment } from '@/app/_hooks/usePhonePePayment';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function PaymentButton({ amount }: { amount: number }) {
  const { initiatePayment, loading, error } = usePhonePePayment();
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleClick = () => {
    // Check if user is not logged in or registered
    if (!session || !session.user) {
      toast.error('Please register or log in to make a payment.');
      router.push('/register');
      return;
    }

    // Only initiate payment if user is authenticated
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
