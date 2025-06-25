import { NextRequest, NextResponse } from 'next/server';
import { sendEmailReply } from '@/lib/services/email-wrapper';
import { 
  approveMessage,
  getConversationMessages,
  updateConversationStatus
} from '@/lib/db/queries-wrapper';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(req: NextRequest) {
  try {
    const { messageId, conversationId } = await req.json();
    
    // Get the message and conversation details
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Get all messages to build references for threading
    const messages = await getConversationMessages(conversationId);
    const emailMessages = messages.filter(m => m.email_message_id);
    const references = emailMessages.map(m => m.email_message_id).filter(Boolean);
    
    // Get the last inbound message for reply-to
    const lastInbound = messages
      .filter(m => m.direction === 'inbound' && m.email_message_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    // Send the email
    await sendEmailReply(
      conversation.client_email,
      conversation.subject,
      message.final_response || message.gemini_response,
      lastInbound?.email_message_id,
      references
    );
    
    // Mark message as sent
    await approveMessage(messageId, 1, message.final_response || message.gemini_response);
    
    // Update conversation status
    await updateConversationStatus(conversationId, 'sent');
    
    // Update conversation timestamps and status
    await supabaseAdmin
      .from('conversations')
      .update({ 
        last_our_response_at: new Date().toISOString(),
        conversation_status: 'waiting_for_client',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully'
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }, { status: 500 });
  }
}