// Edge-compatible auth utilities
// Uses jose instead of jsonwebtoken for Edge Runtime compatibility

import { SignJWT, jwtVerify } from 'jose';
import { SHA256 } from 'crypto-js';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = '7d';

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);

// Simple password hashing for Edge Runtime (Note: In production, use proper hashing on server-side only)
export async function hashPassword(password: string): Promise<string> {
  // This is a simplified hash for Edge compatibility
  // In production, password hashing should only be done in Node.js runtime
  return SHA256(password + JWT_SECRET).toString();
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // This is a simplified verification for Edge compatibility
  const testHash = SHA256(password + JWT_SECRET).toString();
  return testHash === hashedPassword;
}

// JWT tokens using jose (Edge-compatible)
export async function generateToken(userId: number, email: string, role: string): Promise<string> {
  const jwt = await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secret);
  
  return jwt;
}

export async function verifyToken(token: string): Promise<{ userId: number; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}