import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getUserFromRequest } from '@/lib/auth/get-user';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, conversationId, scheduledSendAt } = await req.json();
    
    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledSendAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 });
    }
    
    // Update message with scheduled send time
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({
        scheduled_send_at: scheduledSendAt,
        schedule_status: 'scheduled'
      })
      .eq('id', messageId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Create schedule log entry
    const { error: logError } = await supabaseAdmin
      .from('email_schedule_log')
      .insert({
        message_id: messageId,
        scheduled_for: scheduledSendAt,
        status: 'pending',
        created_by_user_id: user.userId
      });
    
    if (logError) {
      console.error('Error creating schedule log:', logError);
    }
    
    // Update conversation status
    await supabaseAdmin
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Email scheduled successfully',
      scheduledFor: scheduledDate.toISOString()
    });
    
  } catch (error: any) {
    console.error('Error scheduling email:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to schedule email' 
    }, { status: 500 });
  }
}