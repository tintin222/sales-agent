-- Add email scheduling fields to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS schedule_status VARCHAR(50) DEFAULT NULL CHECK (schedule_status IN ('scheduled', 'sending', 'sent', 'failed', 'cancelled'));

-- Add index for scheduled emails
CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_send_at, schedule_status) 
WHERE scheduled_send_at IS NOT NULL;

-- Create email schedule log table for tracking scheduled email history
CREATE TABLE IF NOT EXISTS email_schedule_log (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  actual_sent_at TIMESTAMP,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_user_id INTEGER REFERENCES users(id)
);

-- Add company-wide scheduling settings
ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS default_send_time_start TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS default_send_time_end TIME DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS default_timezone VARCHAR(50) DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS skip_weekends BOOLEAN DEFAULT true;