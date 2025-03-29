import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Link from 'next/link'

interface PricingCardProps {
	title: string
	price: string
	description: string
	features: string[]
	buttonText: string
	buttonVariant: 'default' | 'outline'
	highlighted?: boolean
}

export default function PricingCard({
	title,
	price,
	description,
	features,
	buttonText,
	buttonVariant,
	highlighted = false,
}: PricingCardProps) {
	return (
		<Card className={`flex flex-col ${highlighted ? 'border-primary shadow-lg scale-105' : ''}`}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<div className="flex items-baseline gap-1">
					<span className="text-3xl font-bold">{price}</span>
					{price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
				</div>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="flex-1">
				<ul className="space-y-2">
					{features.map((feature, i) => (
						<li key={i} className="flex items-center gap-2">
							<Check className="h-4 w-4 text-primary" />
							<span>{feature}</span>
						</li>
					))}
				</ul>
			</CardContent>
			<CardFooter>
				<Button variant={buttonVariant} className="w-full" asChild>
					<Link href="/signup">{buttonText}</Link>
				</Button>
			</CardFooter>
		</Card>
	)
}
