import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { hashPassword } from '@/lib/auth/config';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';
import { getUserFromRequest } from '@/lib/auth/get-user';

const COMPANY_ID = getActiveCompanyId();

// GET all users for the company
export async function GET(req: NextRequest) {
  try {
    // Get user from token
    const user = getUserFromRequest(req);
    
    console.log('GET /api/users - User:', user);
    
    // Only admins can view all users
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('company_id', COMPANY_ID)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(users || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    
    // Only admins can create users
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { email, name, password, role } = await req.json();

    // Validate input
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: COMPANY_ID,
        email,
        name,
        role,
        password_hash: passwordHash
      })
      .select('id, email, name, role, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}