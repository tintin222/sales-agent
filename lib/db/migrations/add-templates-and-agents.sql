-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  content TEXT NOT NULL,
  variables TEXT[], -- List of variables that can be replaced in the template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Virtual agents table
CREATE TABLE IF NOT EXISTS virtual_agents (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  profile_photo_url TEXT,
  knowledge_base TEXT NOT NULL, -- Description of what this agent knows
  writing_style TEXT NOT NULL, -- Description of communication style
  sample_responses TEXT[], -- Array of sample responses
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES email_templates(id),
ADD COLUMN IF NOT EXISTS agent_id INTEGER REFERENCES virtual_agents(id);

-- Add foreign keys to conversations table for default selections
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS selected_template_id INTEGER REFERENCES email_templates(id),
ADD COLUMN IF NOT EXISTS selected_agent_id INTEGER REFERENCES virtual_agents(id);

-- Indexes
CREATE INDEX idx_email_templates_company_active ON email_templates(company_id, is_active);
CREATE INDEX idx_virtual_agents_company_active ON virtual_agents(company_id, is_active);
CREATE INDEX idx_messages_template ON messages(template_id);
CREATE INDEX idx_messages_agent ON messages(agent_id);