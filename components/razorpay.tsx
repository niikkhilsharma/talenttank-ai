'use client'

import Script from 'next/script'
import { useState } from 'react'
import { Button } from './ui/button'

interface PaymentButtonProps {
	getAvailableCredits?: () => Promise<void>
}

export default function PaymentButton({ getAvailableCredits }: PaymentButtonProps) {
	const [loading, setLoading] = useState(false)

	const handlePayment = async () => {
		setLoading(true)

		try {
			const response = await fetch('/api/razorpay/payment', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			})

			const data = await response.json()
			if (!data.success) throw new Error(data.error)

			const { order, user } = data

			const options = {
				key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
				amount: order.amount,
				currency: order.currency,
				name: 'Talentank AI',
				description: 'Talentank AI',
				order_id: order.id,
				// @ts-expect-error //ignore
				handler: async function (response) {
					const data = {
						orderCreationId: order.id,
						razorpayPaymentId: response.razorpay_payment_id,
						razorpayOrderId: response.razorpay_order_id,
						razorpaySignature: response.razorpay_signature,
					}

					const result = await fetch('/api/razorpay/verify', {
						method: 'POST',
						body: JSON.stringify(data),
						headers: { 'Content-Type': 'application/json' },
					})
					const res = await result.json()
					//process further request, whatever should happen after request fails
					if (res.isOk) {
						alert(res.message)
						if (getAvailableCredits) getAvailableCredits()
					} //process further request after
					else {
						alert(res.message)
					}
					// alert(response.razorpay_payment_id)
					// alert(response.razorpay_order_id)
					// alert(response.razorpay_signature)
				},

				prefill: { name: user.firstName + ' ' + user.lastName, email: user.email },
				notes: { address: 'Razorpay corporate offices' },
				theme: { color: '#3399cc' },
			}

			// @ts-expect-error	//ignore
			const razorpay = new window.Razorpay(options)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			razorpay.on('payment.failed', function (response: any) {
				alert(response.error.description)
			})
			razorpay.open()
		} catch (error) {
			alert('Payment failed! ' + error)
		}

		setLoading(false)
	}

	return (
		<div className="w-full">
			<Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
			<Button onClick={handlePayment} disabled={loading} className="w-full">
				{loading ? 'Processing...' : 'Pay ₹299'}
			</Button>
		</div>
	)
}
