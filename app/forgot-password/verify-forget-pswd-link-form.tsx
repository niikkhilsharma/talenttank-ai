'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const FormSchema = z.object({
	password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
})

export default function ResetPasswordForm() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const token = searchParams.get('token')

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			password: '',
		},
	})

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		if (!token) {
			toast.error('Invalid or missing token')
			return
		}

		try {
			const res = await axios.post('/api/auth/verify-forget-password-link', {
				token,
				password: data.password,
			})

			toast.success(res.data.message)
			router.push('/login')
		} catch (error) {
			// @ts-expect-error error response handling
			toast.error(error?.response?.data?.error || 'Failed to reset password')
		}
	}

	return (
		<div className="space-y-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>New Password</FormLabel>
								<FormControl>
									<Input type="password" placeholder="Enter your new password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="mt-3 w-full">
						Reset Password
					</Button>
				</form>
			</Form>
		</div>
	)
}
