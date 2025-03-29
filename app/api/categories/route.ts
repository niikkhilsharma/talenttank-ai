import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/prisma'

export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			include: {
				_count: {
					select: {
						questions: true,
					},
				},
			},
		})

		return NextResponse.json(
			categories.map(category => ({
				...category,
				questionsCount: category._count.questions,
			}))
		)
	} catch (error) {
		console.error('Error fetching categories:', error)
		return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { name } = body

		if (!name) {
			return NextResponse.json({ error: 'Name is required' }, { status: 400 })
		}

		const category = await prisma.category.create({
			data: {
				name,
			},
		})

		return NextResponse.json(category)
	} catch (error) {
		console.error('Error creating category:', error)
		return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
	}
}
