import crypto from 'crypto'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/prisma'

export async function POST(req: Request) {
	console.log('webhook is hit ------------------------------------------------------------')

	try {
		const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET! // Set this in Razorpay dashboard
		const headersList = await headers()
		const signature = headersList.get('x-razorpay-signature')
		console.log(signature, '--------------------------------------------------------------------------------')

		const rawBody = await req.text()
		const parsedBody = JSON.parse(rawBody)
		console.log(parsedBody)
		const { event, payload } = parsedBody

		const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')

		if (signature !== expectedSignature) {
			return NextResponse.json({ success: false, message: 'Invalid Webhook Signature' }, { status: 400 })
		}

		if (event === 'payment.captured') {
			const paymentData = payload.payment.entity
			console.log('✅ Payment Captured:', paymentData)

			const { id, order_id, amount, currency, method, status } = paymentData

			const user = await prisma.user.findUnique({
				where: { email: paymentData.email },
			})

			if (!user) {
				return NextResponse.json({ success: false, message: 'User not found' })
			}
			console.log(order_id, user.id)
			const dbCreatedPayment = await prisma.payment.update({
				where: { userId: user.id, razorpayOrderId: order_id },
				data: {
					amount: amount / 100, // Convert from paisa to rupees
					currency,
					status: status === 'captured' ? 'COMPLETED' : 'FAILED',
					razorpayPaymentId: id,
					razorpaySignature: signature,
					paymentMethod: method,
				},
			})
			console.log(dbCreatedPayment, order_id)

			const creditsAdded = await prisma.user.update({
				where: { id: user.id },
				data: {
					totalPaymentMade: user.totalPaymentMade + amount / 100,
					totalCredits: user.totalCredits + 5,
				},
			})

			console.log('✅ Payment saved to database!', dbCreatedPayment, creditsAdded)
			return NextResponse.json({ success: true, message: 'Payment Processed & Saved' })
		}

		return NextResponse.json({ success: true, message: 'Webhook Received' })
	} catch (error) {
		console.log(error)
		return NextResponse.json({ success: false, message: 'Error Processing Webhook', error })
	}
}
