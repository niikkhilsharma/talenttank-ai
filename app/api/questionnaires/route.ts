import prisma from '@/lib/prisma/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const questionnaires = await prisma.questionnaire.findMany({
			include: {
				_count: {
					select: {
						questions: true,
					},
				},
			},
		})

		return NextResponse.json(
			questionnaires.map(questionnaire => ({
				...questionnaire,
				totalQuestions: questionnaire._count.questions,
			}))
		)
	} catch (error) {
		console.error('Error fetching questionnaires:', error)
		return NextResponse.json({ error: 'Failed to fetch questionnaires' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { title, description } = body

		if (!title) {
			return NextResponse.json({ error: 'Title is required' }, { status: 400 })
		}

		const questionnaire = await prisma.questionnaire.create({
			data: {
				title,
				description,
			},
		})

		return NextResponse.json(questionnaire)
	} catch (error) {
		console.error('Error creating questionnaire:', error)
		return NextResponse.json({ error: 'Failed to create questionnaire' }, { status: 500 })
	}
}
