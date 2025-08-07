'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import axios from 'axios'

const FormSchema = z.object({
	email: z.string().email('Invalid email address'),
})

export default function ForgotPasswordForm() {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			email: '',
		},
	})

	async function onSubmit(data: z.infer<typeof FormSchema>) {
		try {
			const email = data.email.trim()
			const response = await axios.post('/api/auth/send-forget-password-link', { email })
			const responseData = response.data
			console.log(responseData)

			toast.success(responseData.message || 'Password reset email sent successfully')
		} catch (error) {
			console.log(error)
			// @ts-expect-error //Error might not have a message property
			toast.error(error?.response?.data?.message || 'Failed to send password reset email')
		}
	}
	return (
		<div className="space-y-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="Please enter your email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" className="mt-3 w-full">
						Submit
					</Button>
				</form>
			</Form>
		</div>
	)
}
