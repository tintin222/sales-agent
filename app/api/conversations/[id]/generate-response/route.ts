import { NextRequest, NextResponse } from 'next/server';
import { 
  getConversationMessages,
  getActiveSystemPrompt,
  getActivePricingDocuments,
  getCompanySettings,
  updateConversationStatus,
  getActiveCompanyId
} from '@/lib/db/queries-wrapper';
import { generatePricingResponse } from '@/lib/services/gemini';
import type { GeminiContext, PricingDocument } from '@/types';
import { supabaseAdmin } from '@/lib/db/supabase';

const COMPANY_ID = getActiveCompanyId();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversationId = parseInt(id);
    const { modelId, templateId, agentId } = await req.json();
    
    // Get conversation details
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Get all messages in conversation for context
    const messages = await getConversationMessages(conversationId);
    
    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages in conversation' }, { status: 400 });
    }
    
    // Get the latest inbound message
    const latestInbound = messages
      .filter(m => m.direction === 'inbound')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!latestInbound) {
      return NextResponse.json({ error: 'No inbound message found' }, { status: 400 });
    }
    
    // Get system prompt
    const systemPrompt = await getActiveSystemPrompt(COMPANY_ID, 'main');
    if (!systemPrompt) {
      return NextResponse.json({ 
        error: 'No system prompt configured. Please set up a system prompt in the admin panel.' 
      }, { status: 400 });
    }
    
    // Get pricing documents
    const documents = await getActivePricingDocuments(COMPANY_ID);
    if (documents.length === 0) {
      return NextResponse.json({ 
        error: 'No pricing documents found. Please upload pricing documents in the admin panel.' 
      }, { status: 400 });
    }
    
    // Get template if specified
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('company_id', COMPANY_ID)
        .single();
      template = templateData;
    }
    
    // Get agent if specified
    let agent = null;
    if (agentId) {
      const { data: agentData } = await supabaseAdmin
        .from('virtual_agents')
        .select('*')
        .eq('id', agentId)
        .eq('company_id', COMPANY_ID)
        .single();
      agent = agentData;
    }
    
    // Update conversation with selected template and agent
    if (templateId || agentId) {
      await supabaseAdmin
        .from('conversations')
        .update({
          selected_template_id: templateId || conversation.selected_template_id,
          selected_agent_id: agentId || conversation.selected_agent_id
        })
        .eq('id', conversationId);
    }
    
    // Get company settings for default model if not specified
    const settings = await getCompanySettings(COMPANY_ID);
    const selectedModel = modelId || settings?.default_model || 'gemini-1.5-pro';
    
    // Organize documents by type
    const criteria = documents.filter((d: PricingDocument) => d.document_type === 'criteria')
      .map(d => d.content_text).join('\n\n');
    const calculations = documents.filter((d: PricingDocument) => d.document_type === 'calculation')
      .map(d => d.content_text).join('\n\n');
    const additional = documents.filter((d: PricingDocument) => d.document_type === 'general')
      .map(d => d.content_text);
    
    // Enhance system prompt with agent information
    let enhancedSystemPrompt = systemPrompt.content;
    if (agent) {
      enhancedSystemPrompt += `\n\nYou are ${agent.name}, a virtual sales agent with the following characteristics:
      
Knowledge Base: ${agent.knowledge_base}

Writing Style: ${agent.writing_style}

${agent.sample_responses && agent.sample_responses.length > 0 ? `Sample Responses for reference:
${agent.sample_responses.join('\n\n---\n\n')}` : ''}`;
    }
    
    // Add template instructions if provided
    if (template) {
      enhancedSystemPrompt += `\n\nUse the following email template as a guide for your response:
      
Template: ${template.name}
${template.subject ? `Subject: ${template.subject}` : ''}

Content:
${template.content}

${template.variables && template.variables.length > 0 ? `Available variables to replace: ${template.variables.join(', ')}` : ''}
`;
    }
    
    // Build Gemini context with full conversation history
    const context: GeminiContext = {
      systemPrompt: enhancedSystemPrompt,
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
      currentRequest: latestInbound.content
    };
    
    // Generate response
    const response = await generatePricingResponse(context, selectedModel);
    
    // Save the generated response with template and agent info
    const { data: newMessage } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'outbound',
        content: response,
        gemini_response: response,
        template_id: templateId || null,
        agent_id: agentId || null
      })
      .select()
      .single();
    
    // Update conversation status to pending review
    await updateConversationStatus(conversationId, 'pending_review');
    
    return NextResponse.json({ 
      success: true,
      message: newMessage,
      response 
    });
    
  } catch (error) {
    console.error('Error generating response:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to generate response' 
    }, { status: 500 });
  }
}