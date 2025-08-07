import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secret-key'

export function generateResetToken(email: string) {
	return jwt.sign({ email }, JWT_SECRET, { expiresIn: '15m' }) // 15 min validity
}

export function verifyResetToken(token: string): { email: string } {
	return jwt.verify(token, JWT_SECRET) as { email: string }
}
