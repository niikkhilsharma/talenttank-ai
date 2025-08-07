import { NextRequest, NextResponse } from 'next/server'
import * as z from 'zod'
import { ForgetPasswordTemplate } from '@/components/email-template/forget-password-template'
import { Resend } from 'resend'
import prisma from '@/lib/prisma/prisma'
import { generateResetToken } from '@/lib/auth/jwt'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
	try {
		const emailSchema = z.object({
			email: z.string().email(),
		})
		const payload = await request.json()
		console.log(payload)
		const { email } = emailSchema.parse(payload)

		if (!email) {
			return NextResponse.json({ message: 'Email is required' }, { status: 400 })
		}

		const user = await prisma.user.findUnique({ where: { email } })
		if (!user) {
			return NextResponse.json({ message: 'This email is not associated with any account' }, { status: 400 })
		}

		const token = generateResetToken(email)
		const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`

		const { data, error } = await resend.emails.send({
			from: 'Talentank <no-reply@talentank.in>',
			to: [email],
			subject: 'Hello world',
			react: ForgetPasswordTemplate({ firstName: 'John', resetLink }),
		})

		if (error) {
			return NextResponse.json({ message: 'Failed to send email' }, { status: 500 })
		}

		console.log(data)
		return NextResponse.json({ message: 'Password reset link sent to your email' }, { status: 200 })
	} catch (error) {
		console.log(error)
		if (error instanceof z.ZodError) {
			return NextResponse.json({ message: error.errors[0].message }, { status: 400 })
		}
		// @ts-expect-error //Error have a message property
		return NextResponse.json({ message: error.message || 'Unexpected error occurred' }, { status: 500 })
	}
}
