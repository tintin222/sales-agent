import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUserFromRequest } from '@/lib/auth/get-user';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Get the current user from token
    const user = getUserFromRequest(req);
    
    const updateData: any = {
      final_response: body.final_response
    };
    
    // Track who approved the message
    if (user) {
      updateData.approved_by_user_id = user.userId;
    }
    
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}