import { NextResponse } from 'next/server'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { auth } from '@/auth'
import { z } from 'zod'
import { AiQuestionSchema, questionSchema } from '@/utils/zod/questions-schema'
import { ChatOpenAI } from '@langchain/openai'
import prisma from '@/lib/prisma/prisma'
import { Question } from '@/types/questions'

// Use a supported OpenAI model
const llm = new ChatOpenAI({
	modelName: 'gpt-4o-mini', // Changed from 'o3-mini'
	temperature: 0.7,
	timeout: 60000, // 60 second timeout
})

export async function POST(request: Request) {
	console.log('=== API Route Started ===')
	
	try {
		// Auth check
		const session = await auth()
		const user = session?.user

		if (!user || !user.id) {
			console.log('Auth failed - no user or user ID')
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.log('User authenticated:', user.id)

		// Parse request body
		let body
		try {
			body = await request.json()
		} catch (parseError) {
			console.error('JSON parsing error:', parseError)
			return NextResponse.json({
				success: false,
				message: 'Invalid JSON in request body'
			}, { status: 400 })
		}

		const { answers } = body
		if (!answers) {
			console.log('No answers provided in request')
			return NextResponse.json({
				success: false,
				message: 'Answers are required'
			}, { status: 400 })
		}

		console.log('Received answers:', JSON.stringify(answers, null, 2))

		// Test database connection
		try {
			await prisma.$connect()
			console.log('Database connected successfully')
		} catch (dbError) {
			console.error('Database connection error:', dbError)
			return NextResponse.json({
				success: false,
				message: 'Database connection failed'
			}, { status: 500 })
		}

		// Save normal answers to DB
		console.log('Saving normal answers to DB...')
		let dbSaveResponse
		try {
			dbSaveResponse = await SaveNormalAnswerToDB(answers, user.id)
			console.log('Normal answers saved successfully:', dbSaveResponse)
		} catch (dbError) {
			console.error('Error saving normal answers:', dbError)
			return NextResponse.json({
				success: false,
				message: 'Failed to save answers to database',
				error: dbError instanceof Error ? dbError.message : 'Unknown database error'
			}, { status: 500 })
		}

		// Generate AI questions
		console.log('Generating AI questions...')
		const systemPrompt = `Generate 50 follow-up questions based on the given answers to assess Predictive Index (PI) and Emotional Intelligence (EQ).
    
Guidelines:
- 25 questions should assess Predictive Index (PI): behavioral traits, cognitive abilities, and job fit.
- 25 questions should assess Emotional Intelligence (EQ): self-awareness, relationship management, and empathy.
- Use various formats: multiple-choice, situational judgment, true/false, scenario-based, and open-ended (input_text).
- For "input_text" questions, do NOT include "options".
- Tailor questions to real-world workplace challenges.

Example input_text question:
{{
  "id": 10,
  "question": "Describe a time when you had to manage a difficult workplace situation.",
  "type": "input_text",
  "placeholder": "Write your response here...",
  "category": "emotional_intelligence"
}}
		
Provide questions formatted as a JSON array, following this schema:
{{
  "id": number,
  "question": string,
  "type": "multiple_choice" | "input_text",
  "options": [string, string, string, string] (optional, only for multiple_choice),
  "placeholder": string (optional, only for input_text),
  "category": "predictive_index" | "emotional_intelligence"
}}`

		const humanPrompt = `Base follow-up questions on these candidate responses: ${JSON.stringify(answers)
			.replaceAll('{', '')
			.replaceAll('}', '')}

Generate the 50 questions now.`

		const promptTemplate = ChatPromptTemplate.fromMessages([
			['system', systemPrompt],
			['human', humanPrompt],
		])

		// Create a modified schema compatible with OpenAI structured outputs
		const OpenAICompatibleQuestionSchema = z.object({
			id: z.number(),
			question: z.string(),
			type: z.enum(['multiple_choice', 'input_text']),
			options: z.array(z.string()).nullable(), // Use nullable instead of optional
			placeholder: z.string().nullable(), // Use nullable instead of optional
			category: z.enum(['predictive_index', 'emotional_intelligence']),
		})

		const QuestionArraySchema = z.object({
			count: z.number(),
			questions: z.array(OpenAICompatibleQuestionSchema),
		})

		let questions
		try {
			const structured_llm = llm.withStructuredOutput(QuestionArraySchema, { name: 'questions' })
			
			// First invoke the template to get the formatted messages
			const formattedPrompt = await promptTemplate.invoke({})
			
			console.log('Calling OpenAI API...')
			questions = await structured_llm.invoke(formattedPrompt)
			console.log('AI questions generated:', questions.count, 'questions')
		} catch (aiError) {
			console.error('OpenAI API error:', aiError)
			return NextResponse.json({
				success: false,
				message: 'Failed to generate AI questions',
				error: aiError instanceof Error ? aiError.message : 'Unknown AI error'
			}, { status: 500 })
		}

		// Save AI questions to DB
		console.log('Saving AI questions to DB...')
		let aiQuestionSaveResponse
		try {
			// Convert nullable fields back to optional/empty for database saving
			const questionsForDB = questions.questions.map(q => ({
				...q,
				options: q.options || [],
				placeholder: q.placeholder || '',
			}))
			
			aiQuestionSaveResponse = await SaveAiQuestionsToDB(questionsForDB, questions.count)
			console.log('AI questions saved successfully:', aiQuestionSaveResponse)
		} catch (dbError) {
			console.error('Error saving AI questions:', dbError)
			return NextResponse.json({
				success: false,
				message: 'Failed to save AI questions to database',
				error: dbError instanceof Error ? dbError.message : 'Unknown database error'
			}, { status: 500 })
		}

		console.log('=== API Route Completed Successfully ===')
		return NextResponse.json({
			success: true,
			dbSaveResponse,
			aiQuestionSaveResponse,
		})

	} catch (error) {
		console.error('=== Unexpected Error in API Route ===', error)
		return NextResponse.json({
			success: false,
			message: 'An unexpected error occurred',
			error: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 })
	} finally {
		// Always disconnect from database
		try {
			await prisma.$disconnect()
			console.log('Database disconnected')
		} catch (disconnectError) {
			console.error('Error disconnecting from database:', disconnectError)
		}
	}
}

async function SaveAiQuestionsToDB(questions: any[], questionCount: number) {
	console.log('Starting SaveAiQuestionsToDB with', questions.length, 'questions')
	
	try {
		// Step 1: Create the assessment first
		const createdAssessment = await prisma.aIQuestionnaire.create({
			data: {
				totalQuestions: questionCount,
			},
		})

		console.log('Assessment created:', createdAssessment.id)

		// Step 2: Add questions separately
		if (questions.length > 0) {
			await prisma.aIQuestion.createMany({
				data: questions.map(q => ({
					question: q.question,
					type: q.type,
					options: Array.isArray(q.options) ? q.options : [],
					placeholder: typeof q.placeholder === 'string' ? q.placeholder : '',
					category: q.category,
					aIQuestionnaireId: createdAssessment.id,
				})),
			})
			console.log('AI questions created successfully')
		}

		return {
			success: true,
			assessmentId: createdAssessment.id,
		}
	} catch (error) {
		console.error('Error in SaveAiQuestionsToDB:', error)
		throw error
	}
}

async function SaveNormalAnswerToDB(answers: Question[], userId: string) {
	console.log('Starting SaveNormalAnswerToDB for user:', userId)
	
	try {
		if (!userId) {
			throw new Error('User ID is missing')
		}

		if (!Array.isArray(answers) || answers.length === 0) {
			throw new Error('Invalid answers format or empty answers')
		}

		// Validate questions format
		const validatedQuestions = z.array(questionSchema).parse(answers)
		console.log('Questions validated successfully, count:', validatedQuestions.length)

		const response = await prisma.user.update({
			where: { id: userId },
			data: {
				Answers: { 
					createMany: { 
						data: [{ answers: validatedQuestions }] 
					} 
				},
			},
		})

		console.log('User updated with answers successfully')

		return {
			success: true,
			answersCount: validatedQuestions.length,
			userId: response.id,
		}
	} catch (error) {
		console.error('Error in SaveNormalAnswerToDB:', error)
		throw error
	}
}
