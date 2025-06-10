import { NextRequest } from 'next/server';
import { verifyToken } from './config';

export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  };
}