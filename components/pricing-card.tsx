// C:\PERSONAL FILES\SANDBOX\WEB PROJECTS\TALENTTANK-AI\COMPONENTS\pricing-card.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { PhonePeSDKButton } from './phonepe-sdk-button';

interface PricingCardProps {
	title: string;
	price: string;
	amount: number;
	description: string;
	features: string[];
	buttonText: string; 
	highlighted?: boolean;
    sdkReady: boolean; // <-- THE FIX IS HERE: Add sdkReady to the props
}

export default function PricingCard({ 
    title, 
    price, 
    amount, 
    description, 
    features, 
    highlighted = false,
    sdkReady, // <-- THE FIX IS HERE: Destructure the new prop
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
				{/* THE FIX IS HERE: Pass the sdkReady prop down to the button */}
				<PhonePeSDKButton amount={amount} sdkReady={sdkReady} />
			</CardFooter>
		</Card>
	);
}