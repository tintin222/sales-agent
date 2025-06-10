-- Create attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  size INTEGER,
  storage_path TEXT, -- Path in storage (e.g., S3 key or local path)
  storage_url TEXT, -- Public URL if available
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for quick lookups
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- Add attachment count to messages for quick reference
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_count INTEGER DEFAULT 0;