import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const id = Number.parseInt(params.id)

		if (isNaN(id)) {
			return NextResponse.json({ error: 'Invalid questionnaire ID' }, { status: 400 })
		}

		const questions = await prisma.question.findMany({
			where: {
				questionnaireId: id,
			},
			include: {
				category: true,
			},
		})

		return NextResponse.json(questions)
	} catch (error) {
		console.error('Error fetching questions:', error)
		return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
	}
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
	try {
		const id = Number.parseInt(params.id)
		const body = await request.json()

		if (isNaN(id)) {
			return NextResponse.json({ error: 'Invalid questionnaire ID' }, { status: 400 })
		}

		// First, check if the questionnaire exists
		const questionnaire = await prisma.questionnaire.findUnique({
			where: { id },
		})

		if (!questionnaire) {
			return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
		}

		// Delete existing questions for this questionnaire
		await prisma.question.deleteMany({
			where: {
				questionnaireId: id,
			},
		})

		// Create new questions
		const questions = await Promise.all(
			body.map(question =>
				prisma.question.create({
					data: {
						question: question.question,
						type: question.type,
						options: question.options,
						placeholder: question.placeholder,
						categoryId: question.categoryId,
						questionnaireId: id,
					},
				})
			)
		)

		// Update the questionnaire's totalQuestions
		await prisma.questionnaire.update({
			where: { id },
			data: {
				totalQuestions: questions.length,
			},
		})

		return NextResponse.json(questions)
	} catch (error) {
		console.error('Error saving questions:', error)
		return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 })
	}
}
