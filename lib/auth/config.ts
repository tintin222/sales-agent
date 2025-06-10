import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = '7d';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT tokens
export function generateToken(userId: number, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}