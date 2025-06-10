-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'sales_rep',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing documents table
CREATE TABLE IF NOT EXISTS pricing_documents (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('criteria', 'calculation', 'general')),
  name VARCHAR(255) NOT NULL,
  content_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System prompts table
CREATE TABLE IF NOT EXISTS system_prompts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  prompt_type VARCHAR(50) NOT NULL CHECK (prompt_type IN ('main', 'clarification')),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  client_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  thread_id VARCHAR(500), -- Email thread ID from Message-ID/References
  status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'sent', 'awaiting_info')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  gemini_response TEXT,
  final_response TEXT,
  approved_by_user_id INTEGER REFERENCES users(id),
  email_message_id VARCHAR(500), -- Email Message-ID for tracking
  email_uid INTEGER, -- IMAP UID for marking as read
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  default_model VARCHAR(100) DEFAULT 'gemini-1.5-pro',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  automation_enabled BOOLEAN DEFAULT false,
  automation_model VARCHAR(100) DEFAULT 'gemini-1.5-flash',
  automation_check_interval INTEGER DEFAULT 5, -- minutes
  automation_domains TEXT[], -- allowed domains for automation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_conversations_company_status ON conversations(company_id, status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_pricing_documents_company_active ON pricing_documents(company_id, is_active);