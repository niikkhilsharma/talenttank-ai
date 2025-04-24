import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma/prisma'

const razorpay = new Razorpay({
	key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
	key_secret: process.env.key_secret,
})

export async function GET() {
	const session = await auth()
	const user = session?.user

	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const options = {
			// here, we are charging the user for 100 INR
			// amount: 299 * 100,
			amount: 1 * 100,
			currency: 'INR',
			receipt: `receipt_${Math.floor(Math.random() * 1000000)}`,
			notes: { userId: user.id as string, date: new Date().toISOString() },
		}

		const response = await razorpay.orders.create(options)

		const addInitialPayment = await prisma.payment.create({
			data: {
				userId: user.id,
				amount: 299,
				currency: 'INR',
				status: 'PENDING',
				razorpayOrderId: response.id,
			},
		})
		console.log(response.id)

		return NextResponse.json({ success: true, order: response, user: user, addInitialPayment }, { status: 200 })
	} catch (error) {
		console.log(error)
		return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
	}
}
