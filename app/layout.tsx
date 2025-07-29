// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\app\layout.tsx

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/navbar';
import { auth } from '@/auth';
import { AdminNav } from '@/components/admin-nav';
import TanstackProvider from '@/components/query-client-provider';
import Footer from '@/components/footer';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'TalentTank AI',
	description: 'AI-Powered Contests Tailored to Your Expertise',
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();
	const user = session?.user;

	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{user ? (user.role === 'ADMIN' ? <AdminNav /> : <Navbar />) : <Navbar />}
				<main className="px-4">
					<TanstackProvider>{children}</TanstackProvider>
					<Footer />
				</main>
				<Toaster />
                {/* The Script tag has been removed from here */}
			</body>
		</html>
	);
}