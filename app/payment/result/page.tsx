"use client"
import dynamic from 'next/dynamic';

const PaymentResultClient = dynamic(() => import('./PaymentResultClient'), {
  ssr: false,
});

export default function PaymentResultPage() {
  return <PaymentResultClient />;
}
