import NextAuth from 'next-auth'
import authConfig from './auth.config'

import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth(async function middleware(request) {
	const allowedPaths = ['/', '/login', '/register', '/api/razorpay/webhook']

	// Add a new header x-current-path which passes the path to downstream components
	const headers = new Headers(request.headers)
	headers.set('x-current-origin', request.nextUrl.origin)

	// Check if the request path is in the allowed list
	if (allowedPaths.includes(request.nextUrl.pathname)) {
		return NextResponse.next({ headers })
	}

	// Redirect to login if not authenticated and not on the login page
	if (!request.auth) {
		const requestedUrl = request.nextUrl.pathname
		const urls = requestedUrl.split('/')
		if (urls[1] === 'seller') {
			const newUrl = new URL('/seller/sign-in', request.nextUrl.origin)
			// return Response.redirect(newUrl, { headers })
			return NextResponse.redirect(newUrl, { headers })
		}

		const newUrl = new URL('/api/auth/signin', request.nextUrl.origin)
		// return Response.redirect(newUrl)
		return NextResponse.redirect(newUrl, { headers })
	}

	return NextResponse.next({ headers })
})

export const config = {
	matcher: ['/((?!api/auth|auth|images|_next/static|auth/*|_next/image|favicon.ico|api/cloudinary/image-upload|^/$).+)', '/'],
}
