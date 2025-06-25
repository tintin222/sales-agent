import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { generatePricingResponse } from '@/lib/services/gemini';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';
import { getUserFromRequest } from '@/lib/auth/get-user';
import type { GeminiModelId } from '@/lib/services/gemini';
import type { GeminiContext } from '@/types';

const COMPANY_ID = getActiveCompanyId();

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
    const conversationId = parseInt(id);
    const { modelId } = await req.json();

    // Get conversation details and messages
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', conversationId)
      .eq('company_id', COMPANY_ID)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get the latest messages for context
    const sortedMessages = conversation.messages
      .sort((a: { created_at: string }, b: { created_at: string }) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Build conversation history
    let conversationHistory = '';
    sortedMessages.forEach((msg: { direction: string; content: string; sent_at?: string; final_response?: string; gemini_response?: string }) => {
      if (msg.direction === 'inbound') {
        conversationHistory += `\nClient: ${msg.content}\n`;
      } else if (msg.sent_at) {
        conversationHistory += `\nOur Response: ${msg.final_response || msg.gemini_response || msg.content}\n`;
      }
    });

    // Get follow-up prompt
    const { data: systemPrompt, error: promptError } = await supabaseAdmin
      .from('system_prompts')
      .select('content')
      .eq('company_id', COMPANY_ID)
      .eq('prompt_type', 'main')
      .eq('is_active', true)
      .single();

    if (promptError || !systemPrompt) {
      return NextResponse.json({ error: 'System prompt not found' }, { status: 500 });
    }

    // Create a follow-up specific prompt
    const followUpPrompt = `${systemPrompt.content}

IMPORTANT: This is a FOLLOW-UP MESSAGE. The client has not responded to our previous email. Generate a polite, brief follow-up message that:
1. References our previous email
2. Asks if they need any additional information
3. Gently reminds them we're available to help
4. Keeps a friendly, non-pushy tone
5. Is shorter than the original response

Previous conversation:
${conversationHistory}

Generate a follow-up email response.`;

    // Get pricing documents
    const { data: documents, error: docsError } = await supabaseAdmin
      .from('pricing_documents')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true);

    if (docsError) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Build GeminiContext
    const context: GeminiContext = {
      systemPrompt: followUpPrompt,
      pricingDocuments: {
        criteria: documents?.find(d => d.document_type === 'criteria')?.content_text || '',
        calculations: documents?.find(d => d.document_type === 'calculation')?.content_text || '',
        additional: documents?.filter(d => d.document_type === 'general').map(d => d.content_text) || []
      },
      emailThread: sortedMessages.map((msg: { id: number; conversation_id: number; direction: string; content: string; gemini_response?: string; final_response?: string; approved_by_user_id?: number; sent_at?: string; created_at: string }) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        direction: msg.direction,
        content: msg.content,
        gemini_response: msg.gemini_response,
        final_response: msg.final_response,
        approved_by_user_id: msg.approved_by_user_id,
        sent_at: msg.sent_at,
        created_at: msg.created_at
      })),
      currentRequest: 'Generate a polite follow-up message'
    };

    // Generate follow-up using Gemini
    const geminiResponse = await generatePricingResponse(context, modelId as GeminiModelId);

    // Create the follow-up message
    const { data: newMessage, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outbound',
        content: 'Follow-up message',
        gemini_response: geminiResponse,
        approved_by_user_id: user.userId
      })
      .select()
      .single();

    if (msgError) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Update conversation timestamps
    await supabaseAdmin
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return NextResponse.json({ success: true, messageId: newMessage.id });
  } catch {
    console.error('Error generating follow-up');
    return NextResponse.json({ error: 'Failed to generate follow-up' }, { status: 500 });
  }
}