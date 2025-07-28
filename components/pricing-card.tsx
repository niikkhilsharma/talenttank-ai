// // C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\pricing-card.tsx

// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
// import { Check } from 'lucide-react'
// // import PaymentButton from './razorpay' // Step 1: Remove the old Razorpay button import
// import { PhonePeButton } from './phonepe-button' // Step 2: Import our new PhonePe button

// interface PricingCardProps {
// 	title: string
// 	price: string // Keep price as string for display (e.g., "$10", "Custom")
// 	amount: number // Add a new 'amount' prop for the actual numeric value for payment
// 	description: string
// 	features: string[]
// 	buttonText: string // Kept for potential future use
// 	highlighted?: boolean
// }

// export default function PricingCard({ 
//     title, 
//     price, 
//     amount, 
//     description, 
//     features, 
//     highlighted = false 
// }: PricingCardProps) {
// 	return (
// 		<Card className={`flex flex-col ${highlighted ? 'border-primary shadow-lg scale-105' : ''}`}>
// 			<CardHeader>
// 				<CardTitle>{title}</CardTitle>
// 				<div className="flex items-baseline gap-1">
// 					<span className="text-3xl font-bold">{price}</span>
// 					{price !== 'Custom' && <span className="text-muted-foreground">/month</span>}
// 				</div>
// 				<CardDescription>{description}</CardDescription>
// 			</CardHeader>
// 			<CardContent className="flex-1">
// 				<ul className="space-y-2">
// 					{features.map((feature, i) => (
// 						<li key={i} className="flex items-center gap-2">
// 							<Check className="h-4 w-4 text-primary" />
// 							<span>{feature}</span>
// 						</li>
// 					))}
// 				</ul>
// 			</CardContent>
// 			<CardFooter className="w-full">
// 				{/* Step 3: Replace the old button with our new PhonePeButton */}
//                 {/* We pass the 'amount' prop to the button so it knows how much to charge */}
// 				<PhonePeButton amount={amount} />
// 			</CardFooter>
// 		</Card>
// 	)
// }



// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\pricing-card.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { PhonePeButton } from './phonepe-button';
import { TestPaymentButton } from './test-payment-button'; // Step 1: Import the new test button

interface PricingCardProps {
	title: string;
	price: string;
	amount: number;
	description: string;
	features: string[];
	buttonText: string; 
	highlighted?: boolean;
}

export default function PricingCard({ 
    title, 
    price, 
    amount, 
    description, 
    features, 
    highlighted = false 
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
			<CardFooter className="w-full">
				<div className="w-full space-y-2">
					{/* The real PhonePe button */}
					<PhonePeButton amount={amount} />
					
					{/* Step 2: Add the Test button below the real one. */}
					{/* This will only render in development mode. */}
					<TestPaymentButton amount={amount} />
				</div>
			</CardFooter>
		</Card>
	)
}