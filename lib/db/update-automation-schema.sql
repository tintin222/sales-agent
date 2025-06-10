-- Add automation columns to existing company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_model VARCHAR(100) DEFAULT 'gemini-1.5-flash',
ADD COLUMN IF NOT EXISTS automation_check_interval INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS automation_domains TEXT[];