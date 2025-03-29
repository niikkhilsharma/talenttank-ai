import prisma from '@/lib/prisma/prisma'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export default async function UserResponsePage() {
	const allUserResponses = await prisma.aIQuestionnaireAnswers.findMany({ include: { User: true } })

	// Group responses by user ID
	const groupedResponses = allUserResponses.reduce((acc, item) => {
		const userId = item.User?.id
		if (!userId) return acc

		if (!acc[userId]) {
			acc[userId] = {
				user: item.User,
				responses: [],
			}
		}
		acc[userId].responses.push(item)

		return acc
	}, {} as Record<string, { user: (typeof allUserResponses)[0]['User']; responses: typeof allUserResponses }>)

	return (
		<div className="py-4">
			<h1 className="text-2xl font-semibold">User Responses</h1>
			<p className="text-sm text-muted-foreground">These are the user responses to the AI-generated questionnaire.</p>

			<div className="flex flex-col gap-6 my-4">
				{Object.values(groupedResponses).map(({ user, responses }) => (
					<div key={user?.id} className="border-b pb-4">
						<div className="flex items-center gap-4 mb-2">
							<Avatar>
								<AvatarImage src={user?.avatarUrl || 'https://github.com/shadcn.png'} />
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium">
									{user?.firstName} {user?.lastName}
								</p>
								<p className="text-sm text-muted-foreground">{user?.jobTitle}</p>
								<p className="text-xs text-muted-foreground">{user?.email}</p>
							</div>
						</div>

						<div className="flex gap-4 flex-wrap">
							{responses.map(item => (
								<Card key={item.id} className="max-w-sm w-full">
									<CardHeader>
										<CardTitle>
											<span className="text-sm text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
										</CardTitle>
									</CardHeader>
									<CardContent className="line-clamp-4 text-sm text-muted-foreground">{item.userSummary}</CardContent>
									<CardFooter className="flex flex-col w-full gap-4">
										<div className="w-full">
											<div className="flex justify-between mb-1">
												<span>Predictive Index</span>
												<span>{item.averagePredictiveIndex}/5</span>
											</div>
											<Progress max={5} value={(item?.averagePredictiveIndex! / 5) * 100} className="h-2" />
										</div>
										<div className="w-full">
											<div className="flex justify-between mb-1">
												<span>Emotional Intelligence</span>
												<span>{item?.averageEmotionalIntelligence}/5</span>
											</div>
											<Progress max={5} value={(item?.averageEmotionalIntelligence! / 5) * 100} className="h-2" />
										</div>
										<Link href={`/admin/report/${user?.id}`} className="text-sm text-blue-500 hover:underline">
											View full report
										</Link>
									</CardFooter>
								</Card>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
