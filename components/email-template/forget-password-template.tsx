import * as React from 'react'

interface ForgetPasswordTemplateProps {
	firstName: string
	resetLink: string
}

export function ForgetPasswordTemplate({ firstName, resetLink }: ForgetPasswordTemplateProps) {
	return (
		<div className="max-w-xl mx-auto px-6 py-10 bg-white text-gray-800 font-sans rounded-lg shadow-md">
			<h1 className="text-2xl font-semibold text-blue-600 mb-4">Hi {firstName},</h1>

			<p className="mb-4">We received a request to reset your password. No worries — it happens to the best of us!</p>

			<p className="mb-6">Click the button below to reset your password and get back into your account:</p>

			<a
				href={resetLink}
				className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded transition duration-200">
				Reset Password
			</a>

			<p className="mt-6 text-sm text-gray-600">
				If you didn&apos;t request this, you can safely ignore this email. Your password will remain unchanged.
			</p>

			<p className="mt-6">
				Thanks,
				<br />
				<span className="font-semibold">The Talentank Team</span>
			</p>
		</div>
	)
}
