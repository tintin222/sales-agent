import { supabaseAdmin } from './supabase';

// Company queries
export async function createCompany(name: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({ name })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCompany(id: number) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Pricing document queries
export async function createPricingDocument(
  companyId: number,
  documentType: 'criteria' | 'calculation' | 'general',
  name: string,
  contentText: string
) {
  const { data, error } = await supabaseAdmin
    .from('pricing_documents')
    .insert({
      company_id: companyId,
      document_type: documentType,
      name,
      content_text: contentText
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getActivePricingDocuments(companyId: number) {
  const { data, error } = await supabaseAdmin
    .from('pricing_documents')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('document_type')
    .order('name');
  
  if (error) throw error;
  return data || [];
}

export async function updatePricingDocument(
  id: number,
  updates: { name?: string; content_text?: string; is_active?: boolean }
) {
  const { data, error } = await supabaseAdmin
    .from('pricing_documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// System prompt queries
export async function createSystemPrompt(
  companyId: number,
  promptType: 'main' | 'clarification',
  content: string
) {
  const { data, error } = await supabaseAdmin
    .from('system_prompts')
    .insert({
      company_id: companyId,
      prompt_type: promptType,
      content
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getActiveSystemPrompt(
  companyId: number,
  promptType: 'main' | 'clarification'
) {
  const { data, error } = await supabaseAdmin
    .from('system_prompts')
    .select('*')
    .eq('company_id', companyId)
    .eq('prompt_type', promptType)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
}

// Conversation queries
export async function createConversation(
  companyId: number,
  clientEmail: string,
  subject: string,
  threadId?: string
) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      company_id: companyId,
      client_email: clientEmail,
      subject,
      thread_id: threadId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Find conversation by thread ID
export async function findConversationByThreadId(
  companyId: number,
  threadId: string
) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('company_id', companyId)
    .eq('thread_id', threadId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getConversations(
  companyId: number,
  status?: string,
  limit = 50
) {
  let query = supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function updateConversationStatus(
  id: number,
  status: 'pending_review' | 'approved' | 'sent' | 'awaiting_info'
) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Message queries
export async function createMessage(
  conversationId: number,
  direction: 'inbound' | 'outbound',
  content: string,
  geminiResponse?: string,
  emailMessageId?: string,
  emailUid?: number
) {
  // Check if message already exists (for inbound emails)
  if (emailMessageId && direction === 'inbound') {
    const { data: existing } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('email_message_id', emailMessageId)
      .single();
    
    if (existing) {
      console.log(`Message with email ID ${emailMessageId} already exists, skipping`);
      return existing;
    }
  }
  
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction,
      content,
      gemini_response: geminiResponse,
      email_message_id: emailMessageId,
      email_uid: emailUid
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId: number) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at');
  
  if (error) throw error;
  return data || [];
}

export async function approveMessage(
  messageId: number,
  userId: number,
  finalResponse: string
) {
  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({
      final_response: finalResponse,
      approved_by_user_id: userId,
      sent_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// User queries
export async function createUser(
  companyId: number,
  email: string,
  name: string,
  role = 'sales_rep'
) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      company_id: companyId,
      email,
      name,
      role
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete document
export async function deletePricingDocument(id: number) {
  const { error } = await supabaseAdmin
    .from('pricing_documents')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Get prompts
export async function getSystemPrompts(companyId: number, limit = 10) {
  const { data, error } = await supabaseAdmin
    .from('system_prompts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// Deactivate prompts
export async function deactivatePrompts(companyId: number, promptType: string) {
  const { error } = await supabaseAdmin
    .from('system_prompts')
    .update({ is_active: false })
    .eq('company_id', companyId)
    .eq('prompt_type', promptType);
  
  if (error) throw error;
}

// Company settings queries
export async function getCompanySettings(companyId: number) {
  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertCompanySettings(
  companyId: number,
  settings: {
    default_model?: string;
    temperature?: number;
    max_tokens?: number;
    automation_enabled?: boolean;
    automation_model?: string;
    automation_check_interval?: number;
    automation_domains?: string[];
    email_provider?: string;
    email_host?: string;
    email_port?: number;
    email_secure?: boolean;
    email_user?: string;
    email_password?: string;
    email_from?: string;
    smtp_host?: string;
    smtp_port?: number;
    smtp_secure?: boolean;
    smtp_user?: string;
    smtp_password?: string;
    oauth_client_id?: string;
    oauth_client_secret?: string;
    oauth_refresh_token?: string;
  }
) {
  // First check if settings exist
  const { data: existing } = await supabaseAdmin
    .from('company_settings')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (existing) {
    // Update existing settings
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', companyId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new settings
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .insert({
        company_id: companyId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}