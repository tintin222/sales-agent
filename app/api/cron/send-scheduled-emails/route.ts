import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { sendEmailReply } from '@/lib/services/email-wrapper';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET(req: NextRequest) {
  try {
    // Check for cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running scheduled email sender...');
    
    // Get all scheduled emails that are due to be sent
    const now = new Date();
    const { data: scheduledMessages, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select(`
        *,
        conversations!inner (
          id,
          client_email,
          subject,
          thread_id,
          company_id
        )
      `)
      .eq('conversations.company_id', COMPANY_ID)
      .eq('direction', 'outbound')
      .eq('schedule_status', 'scheduled')
      .lte('scheduled_send_at', now.toISOString())
      .is('sent_at', null);

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledMessages?.length || 0} emails to send`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process each scheduled email
    for (const message of scheduledMessages || []) {
      try {
        // Update status to sending
        await supabaseAdmin
          .from('messages')
          .update({ schedule_status: 'sending' })
          .eq('id', message.id);

        // Get conversation messages for threading
        const { data: conversationMessages } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('conversation_id', message.conversation_id)
          .order('created_at', { ascending: true });

        const emailMessages = conversationMessages?.filter(m => m.email_message_id) || [];
        const references = emailMessages.map(m => m.email_message_id).filter(Boolean);
        
        // Get the last inbound message for reply-to
        const lastInbound = conversationMessages
          ?.filter(m => m.direction === 'inbound' && m.email_message_id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        // Send the email
        await sendEmailReply(
          message.conversations.client_email,
          message.conversations.subject,
          message.final_response || message.gemini_response,
          lastInbound?.email_message_id,
          references
        );

        // Update message as sent
        await supabaseAdmin
          .from('messages')
          .update({
            sent_at: now.toISOString(),
            schedule_status: 'sent'
          })
          .eq('id', message.id);

        // Update conversation
        await supabaseAdmin
          .from('conversations')
          .update({
            status: 'sent',
            last_our_response_at: now.toISOString(),
            conversation_status: 'waiting_for_client',
            updated_at: now.toISOString()
          })
          .eq('id', message.conversation_id);

        // Update schedule log
        await supabaseAdmin
          .from('email_schedule_log')
          .update({
            actual_sent_at: now.toISOString(),
            status: 'sent'
          })
          .eq('message_id', message.id)
          .eq('status', 'pending');

        results.sent++;
        console.log(`Sent scheduled email ${message.id} to ${message.conversations.client_email}`);

      } catch (error) {
        console.error(`Failed to send scheduled email ${message.id}:`, error);
        
        // Update status to failed
        await supabaseAdmin
          .from('messages')
          .update({ schedule_status: 'failed' })
          .eq('id', message.id);

        // Update schedule log
        await supabaseAdmin
          .from('email_schedule_log')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('message_id', message.id)
          .eq('status', 'pending');

        results.failed++;
        results.errors.push(`Message ${message.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.sent + results.failed,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error in scheduled email sender:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process scheduled emails' 
    }, { status: 500 });
  }
}