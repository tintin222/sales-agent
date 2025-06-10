-- Add company settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  default_model VARCHAR(100) DEFAULT 'gemini-1.5-pro',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);