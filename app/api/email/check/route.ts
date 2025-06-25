import { NextResponse } from 'next/server';
import { fetchUnreadEmails, markEmailAsRead, getThreadId } from '@/lib/services/email-wrapper';
import { 
  findConversationByThreadId,
  createConversation,
  createMessage,
  updateConversationStatus,
  getActiveCompanyId
} from '@/lib/db/queries-wrapper';
import { supabaseAdmin } from '@/lib/db/supabase';
import { storeEmailAttachments } from '@/lib/services/attachment-storage';

const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    console.log('Checking for new emails...');
    
    // Fetch unread emails
    const emails = await fetchUnreadEmails();
    console.log(`Found ${emails.length} unread emails`);
    
    const processed = [];
    
    for (const email of emails) {
      try {
        // Get thread ID for conversation tracking
        const threadId = getThreadId(email);
        
        // Check if conversation exists
        let conversation = await findConversationByThreadId(COMPANY_ID, threadId);
        
        if (!conversation) {
          // Create new conversation
          conversation = await createConversation(
            COMPANY_ID,
            email.from,
            email.subject,
            threadId
          );
          console.log(`Created new conversation for thread ${threadId}`);
        } else {
          console.log(`Found existing conversation ${conversation.id} for thread ${threadId}`);
          // Update conversation status if it was previously sent
          if (conversation.status === 'sent') {
            await updateConversationStatus(conversation.id, 'pending_review');
          }
          
          // Update last client response timestamp and conversation status
          await supabaseAdmin
            .from('conversations')
            .update({ 
              last_client_response_at: new Date().toISOString(),
              conversation_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('id', conversation.id);
        }
        
        // Save the inbound message ONLY - no automatic response generation
        const newMessage = await createMessage(
          conversation.id,
          'inbound',
          email.text,
          undefined,
          email.messageId,
          email.uid
        );
        
        // Store attachments if any
        if (email.attachments && email.attachments.length > 0) {
          console.log(`Storing ${email.attachments.length} attachments for message ${newMessage.id}`);
          await storeEmailAttachments(newMessage.id, email.attachments);
        }
        
        // Mark email as read
        await markEmailAsRead(email.uid);
        
        processed.push({
          from: email.from,
          subject: email.subject,
          conversationId: conversation.id,
          isNewConversation: !conversation.thread_id,
          attachmentCount: email.attachments?.length || 0
        });
        
      } catch (error) {
        console.error(`Error processing email from ${email.from}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: processed.length,
      emails: processed
    });
    
  } catch (error) {
    console.error('Error checking emails:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check emails' 
    }, { status: 500 });
  }
}