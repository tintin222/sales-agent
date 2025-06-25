import { NextResponse } from 'next/server';
import { fetchUnreadEmails, markEmailAsRead, getThreadId, sendEmailReply } from '@/lib/services/email-wrapper';
import { 
  findConversationByThreadId,
  createConversation,
  createMessage,
  updateConversationStatus,
  getCompanySettings,
  getActiveSystemPrompt,
  getActivePricingDocuments,
  getConversationMessages,
  getActiveCompanyId
} from '@/lib/db/queries-wrapper';
import { generatePricingResponse } from '@/lib/services/gemini';
import type { GeminiContext, PricingDocument } from '@/types';

const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    // Check if automation is enabled
    const settings = await getCompanySettings(COMPANY_ID);
    
    if (!settings?.automation_enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Automation is disabled' 
      });
    }

    console.log('Running automated email check...');
    
    // Fetch unread emails
    const emails = await fetchUnreadEmails();
    console.log(`Found ${emails.length} unread emails`);
    
    const processed = [];
    const automatedDomains = settings.automation_domains || [];
    const shouldAutomate = (email: string) => {
      if (automatedDomains.length === 0) return true; // If no domains specified, automate all
      const domain = email.split('@')[1];
      return automatedDomains.some((d: string) => domain.includes(d));
    };
    
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
        }
        
        // Save the inbound message
        await createMessage(
          conversation.id,
          'inbound',
          email.text,
          undefined,
          email.messageId,
          email.uid
        );
        
        // Check if we should automate this email
        if (!shouldAutomate(email.from)) {
          console.log(`Skipping automation for ${email.from} - not in allowed domains`);
          // Mark as read but don't auto-respond
          await markEmailAsRead(email.uid);
          processed.push({
            from: email.from,
            subject: email.subject,
            conversationId: conversation.id,
            automated: false,
            reason: 'Domain not in automation list'
          });
          continue;
        }
        
        // Get all messages in conversation for context
        const messages = await getConversationMessages(conversation.id);
        
        // Get system prompt
        const systemPrompt = await getActiveSystemPrompt(COMPANY_ID, 'main');
        if (!systemPrompt) {
          console.error('No system prompt configured');
          continue;
        }
        
        // Get pricing documents
        const documents = await getActivePricingDocuments(COMPANY_ID);
        if (documents.length === 0) {
          console.error('No pricing documents found');
          continue;
        }
        
        // Use automation model from settings
        const modelId = settings.automation_model || 'gemini-1.5-flash';
        
        // Organize documents by type
        const criteria = documents.filter((d: PricingDocument) => d.document_type === 'criteria')
          .map(d => d.content_text).join('\n\n');
        const calculations = documents.filter((d: PricingDocument) => d.document_type === 'calculation')
          .map(d => d.content_text).join('\n\n');
        const additional = documents.filter((d: PricingDocument) => d.document_type === 'general')
          .map(d => d.content_text);
        
        // Build Gemini context with full conversation history
        const context: GeminiContext = {
          systemPrompt: systemPrompt.content + '\n\nNOTE: You are in automated mode. Be extra careful and professional with your responses.',
          pricingDocuments: {
            criteria,
            calculations,
            additional
          },
          emailThread: messages.map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            direction: m.direction,
            content: m.content,
            created_at: m.created_at
          })),
          currentRequest: email.text
        };
        
        // Generate response
        console.log(`Generating automated response using model: ${modelId}`);
        const response = await generatePricingResponse(context, modelId);
        
        // Save the generated response
        const outboundMessage = await createMessage(
          conversation.id,
          'outbound',
          response,
          response
        );
        
        // Get email references for threading
        const emailMessages = messages.filter(m => m.email_message_id);
        const references = emailMessages.map(m => m.email_message_id).filter(Boolean);
        
        // Automatically send the response
        console.log(`Sending automated response to ${email.from}`);
        await sendEmailReply(
          email.from,
          email.subject,
          response,
          email.messageId,
          [...references, email.messageId]
        );
        
        // Mark the outbound message as sent
        await supabaseAdmin
          .from('messages')
          .update({
            sent_at: new Date().toISOString(),
            approved_by_user_id: 0 // System user
          })
          .eq('id', outboundMessage.id);
        
        // Update conversation status
        await updateConversationStatus(conversation.id, 'sent');
        
        // Mark email as read
        await markEmailAsRead(email.uid);
        
        processed.push({
          from: email.from,
          subject: email.subject,
          conversationId: conversation.id,
          automated: true,
          responseLength: response.length
        });
        
      } catch (error) {
        console.error(`Error processing email from ${email.from}:`, error);
        processed.push({
          from: email.from,
          subject: email.subject,
          automated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: processed.length,
      details: processed
    });
    
  } catch (error) {
    console.error('Error in automated email check:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to check emails automatically' 
    }, { status: 500 });
  }
}

// Import supabaseAdmin for direct database updates
import { supabaseAdmin } from '@/lib/db/supabase';