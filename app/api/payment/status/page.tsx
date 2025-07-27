// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\user\payment\status\page.tsx

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Define the possible states for our UI
type Status = 'LOADING' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'ERROR';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('LOADING');
  const [errorMessage, setErrorMessage] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    // Note: PhonePe sends data via POST, but to get it in a client component,
    // we need a mechanism to pass it. A server component wrapper would be needed
    // to read the POST body. For now, let's assume we can get the transaction ID.
    // A robust way is to poll the latest transaction for the user.
    // For this example, we assume we can get the 'transactionId' from somewhere,
    // like query params for simplicity, even though PhonePe uses POST.
    // Let's call a different endpoint to get the LATEST transaction for this user.
    
    // The redirect from PhonePe is a POST, which is hard to handle in App Router's client components.
    // The *webhook* is our source of truth. This page is just for UX.
    // A simple and effective strategy is to show a "processing" state and then
    // check the status of the user's most recent PENDING payment.

    const fetchStatus = async () => {
      // Let's assume the transactionId is passed as a query parameter for demonstration.
      // In a real scenario with a POST redirect, you'd need a server component to read the body
      // and pass it to the client, or have the client poll its latest transaction.
      const transactionId = searchParams.get('transactionId'); // This is a simplification.

      // If we don't have a transactionId, we can't check the status.
      // The real solution would be to have the server that receives the POST redirect
      // then redirect the user again with the transactionId in the query string.
      if (!transactionId) {
          // Fallback if transactionId is not in URL. This is a critical edge case.
          setStatus('ERROR');
          setErrorMessage('Could not find transaction ID. Please check your dashboard for the latest status.');
          return;
      }
      
      try {
        const response = await fetch(`/api/payment/status/${transactionId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus(data.status); // Will be 'COMPLETED', 'PENDING', or 'FAILED'
          setAmount(data.amount);
        } else {
          setStatus('ERROR');
          setErrorMessage(data.error || 'Failed to fetch payment status.');
        }
      } catch (err) {
        setStatus('ERROR');
        setErrorMessage('An error occurred while contacting the server.');
      }
    };

    // Give the webhook a moment to arrive and process
    const timer = setTimeout(fetchStatus, 2000); // Wait 2 seconds before checking

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (status === 'LOADING') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <Hourglass className="h-16 w-16 text-gray-400 animate-spin" />
        <h1 className="text-2xl font-bold">Verifying Payment...</h1>
        <p className="text-gray-500">Please wait, we are confirming your transaction with the bank.</p>
        <Skeleton className="h-8 w-48 mt-4" />
        <Skeleton className="h-12 w-32 mt-6" />
      </div>
    );
  }

  if (status === 'COMPLETED') {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">Payment Successful!</h1>
        <p className="text-gray-500">
          Your payment of <span className="font-semibold">₹{amount}</span> has been processed.
        </p>
        <p>Your credits have been added to your account.</p>
        <Link href="/user/all-reports">
          <Button className="mt-6">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="flex flex-col items-center text-center space-y-4">
        <XCircle className="h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold">Payment Failed</h1>
        <p className="text-gray-500">
          Unfortunately, we could not process your payment. No amount has been deducted.
        </p>
        <p>Please try again or use a different payment method.</p>
        <Link href="/#pricing">
          <Button variant="outline" className="mt-6">Try Again</Button>
        </Link>
      </div>
    );
  }
  
  // This can happen if the webhook is delayed
  if (status === 'PENDING') {
      return (
        <div className="flex flex-col items-center text-center space-y-4">
          <Hourglass className="h-16 w-16 text-yellow-500" />
          <h1 className="text-2xl font-bold">Payment is Pending</h1>
          <p className="text-gray-500">
            Your transaction is still being processed by the bank.
          </p>
          <p>The status will update automatically. Please check your dashboard in a few minutes.</p>
          <Link href="/user/all-reports">
            <Button className="mt-6">Go to Dashboard</Button>
          </Link>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <XCircle className="h-16 w-16 text-red-500" />
      <h1 className="text-2xl font-bold">An Error Occurred</h1>
      <p className="text-gray-500">{errorMessage}</p>
      <Link href="/#pricing">
        <Button variant="outline" className="mt-6">Return to Pricing</Button>
      </Link>
    </div>
  );
}


export default function PaymentStatusPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full">
                <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                    <PaymentStatusContent />
                </Suspense>
            </div>
        </div>
    );
}