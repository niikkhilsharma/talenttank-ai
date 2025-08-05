'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';

export function usePhonePePayment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initiatePayment(amount: number) {
    setLoading(true);
    setError(null);

    try {
      const resp = await axios.post('/api/phonepe/initiate', { amount });
      const { redirectUrl } = resp.data;

      if (!redirectUrl) throw new Error('No redirect URL returned');
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error('Error initiating PhonePe:', err.response?.data || err.message);
        setError(err.response?.data?.error || err.message);
      } else if (err instanceof Error) {
        console.error('General error initiating PhonePe:', err.message);
        setError(err.message);
      } else {
        console.error('Unknown error initiating PhonePe');
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  return { initiatePayment, loading, error };
}
