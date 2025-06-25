import { NextRequest, NextResponse } from 'next/server';
import { createCompany, createUser, getUserByEmail } from '@/lib/db/queries-supabase';
import { hashPassword } from '@/lib/auth/config';

export async function POST(req: NextRequest) {
  try {
    const { companyName, adminName, adminEmail, adminPassword } = await req.json();

    // Validate input
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if any user exists (system already set up)
    const existingUser = await getUserByEmail(adminEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'System is already set up' },
        { status: 400 }
      );
    }

    // Create company
    const company = await createCompany(companyName);

    // Hash password
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    const user = await createUser(
      company.id,
      adminEmail,
      adminName,
      'admin'
    );

    // Update user with password
    const { updateUserPassword } = await import('@/lib/db/queries-supabase');
    await updateUserPassword(user.id, passwordHash);

    return NextResponse.json({
      success: true,
      message: 'Setup completed successfully'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    );
  }
}