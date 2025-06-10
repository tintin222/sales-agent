import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUserFromRequest } from '@/lib/auth/get-user';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const messageId = parseInt(id);
    
    // Update message to remove scheduling
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({
        scheduled_send_at: null,
        schedule_status: 'cancelled'
      })
      .eq('id', messageId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Update schedule log
    await supabaseAdmin
      .from('email_schedule_log')
      .update({
        status: 'cancelled'
      })
      .eq('message_id', messageId)
      .eq('status', 'pending');
    
    return NextResponse.json({ 
      success: true,
      message: 'Scheduled email cancelled'
    });
    
  } catch (error: any) {
    console.error('Error cancelling scheduled email:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel scheduled email' 
    }, { status: 500 });
  }
}