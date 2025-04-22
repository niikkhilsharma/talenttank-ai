import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/navbar'
import { auth } from '@/auth'
import { AdminNav } from '@/components/admin-nav'
import TanstackProvider from '@/components/query-client-provider'
import Footer from '@/components/footer'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'AI-Powered QuizGenius',
	description: 'AI-Powered QuizGenius',
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await auth()
	const user = session?.user

	return (
		<html lang="en">
			<head>
				<title>QuizGenius - AI-Powered Contest Portal</title>
				<meta
					name="description"
					content="Engage in personalized quiz contests that adapt to your profession and skill level, powered by advanced AI to help you learn and grow."
				/>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{user ? user.role === 'ADMIN' ? <AdminNav /> : <Navbar /> : <Navbar />}
				<main className="px-4">
					<TanstackProvider>{children}</TanstackProvider>
					<Footer />
				</main>
				<Toaster />
			</body>
		</html>
	)
}
