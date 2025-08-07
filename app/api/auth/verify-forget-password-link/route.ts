import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma/prisma'
import { verifyResetToken } from '@/lib/auth/jwt'

export async function POST(req: Request) {
	const { token, password } = await req.json()

	try {
		const { email } = verifyResetToken(token)

		const hashedPassword = await bcrypt.hash(password, 10)
		await prisma.user.update({
			where: { email },
			data: { password: hashedPassword },
		})

		return NextResponse.json({ message: 'Password reset successful' })
	} catch (error) {
		console.log(error)
		return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
	}
}
