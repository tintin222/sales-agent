import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/queries-wrapper';
import { verifyPassword, generateToken } from '@/lib/auth/config';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(email);
    
    console.log('Login attempt:', { 
      email, 
      userFound: !!user,
      userId: user?.id,
      hasPasswordHash: !!user?.password_hash
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    console.log('Password verification:', { isValid });
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set cookie using NextResponse
    response.cookies.set('auth-token', token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      path: '/'
    });
    
    console.log('Cookie set with token:', token.substring(0, 50) + '...');

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}