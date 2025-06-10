export interface Company {
  id: number;
  name: string;
  created_at: Date;
}

export interface User {
  id: number;
  company_id: number;
  email: string;
  name: string;
  role: string;
  created_at: Date;
}

export interface PricingDocument {
  id: number;
  company_id: number;
  document_type: 'criteria' | 'calculation' | 'general';
  name: string;
  content_text: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SystemPrompt {
  id: number;
  company_id: number;
  prompt_type: 'main' | 'clarification';
  content: string;
  is_active: boolean;
  created_at: Date;
}

export interface Conversation {
  id: number;
  company_id: number;
  client_email: string;
  subject: string;
  status: 'pending_review' | 'approved' | 'sent' | 'awaiting_info';
  selected_template_id?: number;
  selected_agent_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: number;
  conversation_id: number;
  direction: 'inbound' | 'outbound';
  content: string;
  gemini_response?: string;
  final_response?: string;
  approved_by_user_id?: number;
  email_message_id?: string;
  email_uid?: number;
  template_id?: number;
  agent_id?: number;
  attachment_count?: number;
  sent_at?: Date;
  created_at: Date;
}

export interface MessageAttachment {
  id: number;
  message_id: number;
  filename: string;
  content_type?: string;
  size?: number;
  storage_path?: string;
  storage_url?: string;
  created_at: Date;
}

export interface EmailTemplate {
  id: number;
  company_id: number;
  name: string;
  subject?: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VirtualAgent {
  id: number;
  company_id: number;
  name: string;
  profile_photo_url?: string;
  knowledge_base: string;
  writing_style: string;
  sample_responses?: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GeminiContext {
  systemPrompt: string;
  pricingDocuments: {
    criteria: string;
    calculations: string;
    additional: string[];
  };
  emailThread: Message[];
  currentRequest: string;
}