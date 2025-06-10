-- Add email-related columns to existing tables if they don't exist

-- Add thread_id to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS thread_id VARCHAR(500);

-- Add email tracking columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS email_message_id VARCHAR(500),
ADD COLUMN IF NOT EXISTS email_uid INTEGER;

-- Add index for thread lookup
CREATE INDEX IF NOT EXISTS idx_conversations_thread_id ON conversations(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_email_message_id ON messages(email_message_id);