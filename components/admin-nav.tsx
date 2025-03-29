'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function AdminNav() {
	const pathname = usePathname()

	const routes = [
		{
			href: '/admin',
			label: 'Dashboard',
			active: pathname === '/admin',
		},
		{
			href: '/admin/report',
			label: 'User Responses',
			active: pathname === '/admin/report',
		},
	]

	return (
		<header className="border-b">
			<div className="container mx-auto p-4 sm:px-0 flex justify-between items-center">
				<h1 className="text-xl font-bold">Admin Dashboard</h1>
				<nav className="flex items-center space-x-4 lg:space-x-6">
					{routes.map(route => (
						<Link
							key={route.href}
							href={route.href}
							className={cn(
								'text-sm font-medium transition-colors hover:text-primary',
								route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
							)}>
							{route.label}
						</Link>
					))}
				</nav>
			</div>
		</header>
	)
}
