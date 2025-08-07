'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'

export function usePhonePePayment() {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function initiatePayment() {
		setLoading(true)
		setError(null)

		try {
			const resp = await fetch('/api/phonepe/initiate', { method: 'POST' })
			console.log(resp, resp.status, resp.redirected)

			if (resp.redirected) {
				toast.error('Kindly login to your account to complete the payment')
				return
			}

			const { redirectUrl } = await resp.json()

			if (!redirectUrl) throw new Error('No redirect URL returned')
			router.push(redirectUrl)
		} catch (err: unknown) {
			if (axios.isAxiosError(err)) {
				console.error('Error initiating PhonePe:', err.response?.data || err.message)
				setError(err.response?.data?.error || err.message)
			} else if (err instanceof Error) {
				console.error('General error initiating PhonePe:', err.message)
				setError(err.message)
			} else {
				console.error('Unknown error initiating PhonePe')
				setError('Unknown error occurred')
			}
		} finally {
			setLoading(false)
		}
	}

	return { initiatePayment, loading, error }
}
