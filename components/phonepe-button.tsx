'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react' // If you're using next-auth

export function PhonePeButton({ amount }: { amount: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // This hook comes from next-auth, use your own logic if you're not using it
  const { data: session, status } = useSession()
  const isUserRegistered = !!session?.user // Adjust according to your logic

  const initiatePayment = async (amount: number) => {
    if (!isUserRegistered) {
      router.push('/register')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Your payment logic here
      alert(`Initiating PhonePe payment of ₹${amount}`)
    } catch (err) {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={() => initiatePayment(amount)} disabled={loading}>
        {loading ? 'Processing...' : `Pay ₹${amount} with PhonePe`}
      </Button>
      {error && <p className="text-destructive mt-2">{error}</p>}
    </div>
  )
}
