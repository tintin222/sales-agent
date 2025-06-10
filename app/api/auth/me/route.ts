import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  return NextResponse.json({
    userId: user.userId,
    email: user.email,
    role: user.role
  });
}