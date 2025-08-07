import ResetPasswordForm from '../forgot-password/verify-forget-pswd-link-form'
import { Suspense } from 'react'

export default function ResetPasswordPage() {
	return (
		<div className="container mx-auto flex min-h-screen flex-col items-center justify-center py-10">
			<div className="mx-auto w-full max-w-3xl space-y-6">
				<div className="space-y-2 text-center">
					<h1 className="text-3xl font-bold">Reset Password</h1>
					<p className="text-gray-500 dark:text-gray-400">Enter your email address to reset your password.</p>
				</div>
				<Suspense fallback={<div>Loading...</div>}>
					<ResetPasswordForm />
				</Suspense>
			</div>
		</div>
	)
}
