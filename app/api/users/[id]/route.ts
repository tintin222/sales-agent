import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { hashPassword } from '@/lib/auth/config';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';
import { getUserFromRequest } from '@/lib/auth/get-user';

const COMPANY_ID = getActiveCompanyId();

// GET single user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { email, name, role, password } = await req.json();

    // Build update object
    const updateData: any = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (password) updateData.password_hash = await hashPassword(password);

    // Prevent admin from removing their own admin role
    if (parseInt(id) === user.userId && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .select('id, email, name, role, created_at')
      .single();

    if (error) throw error;

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (parseInt(id) === user.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if this is the last admin
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('company_id', COMPANY_ID)
      .eq('role', 'admin');

    if (admins && admins.length <= 1) {
      const { data: userToDelete } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', id)
        .single();

      if (userToDelete?.role === 'admin') {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)
      .eq('company_id', COMPANY_ID);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}