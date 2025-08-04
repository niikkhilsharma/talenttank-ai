// components/pricing-card.tsx

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PhonePeSDKButton } from './phonepe-sdk-button';

interface PricingCardProps {
  title: string;
  price: string;
  amount: number;
  description: string;
  features: string[];
  buttonText: string;
  highlighted?: boolean;
  sdkReady: boolean;
}

export default function PricingCard({
  title,
  price,
  amount,
  description,
  features,
  highlighted = false,
  sdkReady,
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
        <ul className="space-y-2 list-disc list-inside">
          {features.map((feature, i) => (
            <li key={i} className="text-sm">
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="w-full">
        <PhonePeSDKButton amount={amount} sdkReady={sdkReady} />
      </CardFooter>
    </Card>
  );
}
