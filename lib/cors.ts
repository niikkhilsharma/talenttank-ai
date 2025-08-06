// lib/cors.ts
import { NextRequest, NextResponse } from 'next/server'

export function handleCors(req: NextRequest) {
	const origin = req.headers.get('origin') || '*'

	const response = NextResponse.next()

	response.headers.set('Access-Control-Allow-Origin', origin)
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
	response.headers.set('Access-Control-Allow-Credentials', 'true')

	if (req.method === 'OPTIONS') {
		return new NextResponse(null, { status: 204, headers: response.headers })
	}

	return response
}
