import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await auth()
	const user = session?.user

	if (!user) {
		redirect('/register')
	} else if (user.role !== 'USER') {
		redirect('/admin')
	}

	return <div>{children}</div>
}
