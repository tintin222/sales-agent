-- Add conversation status tracking
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS conversation_status VARCHAR(50) DEFAULT 'active' 
CHECK (conversation_status IN ('active', 'waiting_for_client', 'negotiating', 'closed_won', 'closed_lost', 'stale'));

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_client_response_at TIMESTAMP;

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_our_response_at TIMESTAMP;

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER REFERENCES users(id);

-- Follow-up reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  reminder_type VARCHAR(50) DEFAULT 'no_response' CHECK (reminder_type IN ('no_response', 'custom', 'scheduled')),
  message TEXT,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation notes table for tracking important details
CREATE TABLE IF NOT EXISTS conversation_notes (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add reminder settings to company settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS follow_up_days_threshold INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS follow_up_enabled BOOLEAN DEFAULT true;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(conversation_status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_response ON conversations(last_client_response_at);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_date ON follow_up_reminders(reminder_date, is_sent);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_conversation ON follow_up_reminders(conversation_id);