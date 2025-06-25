import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Check if cookie is present
  const authToken = req.cookies.get('auth-token');
  
  // Get all cookies
  const allCookies = req.cookies.getAll();
  
  return NextResponse.json({
    hasAuthToken: !!authToken,
    authTokenValue: authToken?.value ? 'Present (hidden)' : 'Not present',
    allCookiesCount: allCookies.length,
    allCookieNames: allCookies.map(c => c.name)
  });
}

export async function POST() {
  // Test setting a cookie
  const response = NextResponse.json({
    message: 'Test cookie set'
  });
  
  response.cookies.set('test-cookie', 'test-value', {
    httpOnly: true,
    secure: false, // Set to false for local testing
    sameSite: 'lax', // Try 'lax' instead of 'strict'
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
  
  return response;
}