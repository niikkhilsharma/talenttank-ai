import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { StandardCheckoutPayRequest, StandardCheckoutPayResponse, PhonePeException } from 'pg-sdk-node'
import { getPhonePeClient } from '@/lib/phonepeClient'

type PayResponseBody = {
	orderId?: string
	redirectUrl?: string
	error?: string
}

console.log('🚀 PhonePe ENV Vars', {
	ID: process.env.PHONEPE_CLIENT_ID,
	SECRET: process.env.PHONEPE_CLIENT_SECRET,
	VERSION: process.env.PHONEPE_CLIENT_VERSION,
	ENV: process.env.PHONEPE_ENV,
})

export async function POST(): Promise<NextResponse<PayResponseBody>> {
	const merchantOrderId = `ORDER_${randomUUID()}`
	console.debug('🆔 merchantOrderId generated:', merchantOrderId)

	const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`
	const payRequest = StandardCheckoutPayRequest.builder()
		.merchantOrderId(merchantOrderId)
		.amount(Math.floor(599 * 100)) // converts to paise
		.redirectUrl(redirectUrl)
		.build()

	console.debug('📬 Request built:', payRequest)

	try {
		const client = getPhonePeClient()
		const resp: StandardCheckoutPayResponse = await client.pay(payRequest)
		console.debug('📨 SDK response:', resp)

		if (!resp.redirectUrl || typeof resp.redirectUrl !== 'string') {
			console.error('❌ redirectUrl missing or wrong type in response:', resp)
			return NextResponse.json({ error: 'Missing redirectUrl' }, { status: 500 })
		}

		console.info('✅ Payment initiated:', merchantOrderId, '→', resp.redirectUrl)
		return NextResponse.json({ orderId: merchantOrderId, redirectUrl: resp.redirectUrl }, { status: 200 })
	} catch (error: unknown) {
		if (error instanceof PhonePeException) {
			console.error(
				'📛 PhonePeException:',
				'statusCode=',
				error.httpStatusCode,
				'code=',
				error.code,
				'message=',
				error.message,
				'data=',
				error.data
			)
			return NextResponse.json({ error: `${error.code}: ${error.message}` }, { status: error.httpStatusCode ?? 500 })
		}

		console.error('🔥 Unexpected error during pay:', error)
		const msg =
			typeof error === 'object' && error !== null && 'message' in error ?
				(error as { message?: unknown }).message
			:	JSON.stringify(error)
		const messageString = typeof msg === 'string' ? msg : JSON.stringify(msg)
		return NextResponse.json({ error: messageString }, { status: 500 })
	}
}
