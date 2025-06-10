-- Create admin user directly in the database
-- 
-- IMPORTANT: Change the email and company name below before running
-- The default password is 'admin123' (hashed with bcrypt)

-- First, create a company if it doesn't exist
INSERT INTO companies (id, name, created_at)
VALUES (1, 'My Company', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create admin user with hashed password
-- Password: admin123
-- You can change the email below
INSERT INTO users (id, company_id, email, name, role, password_hash, created_at)
VALUES (
  2,  -- User ID 2 as specified
  1, 
  'admin@company.com',  -- Change this email if needed
  'Admin User',         -- Change this name if needed
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQe6rQqIRC2W',  -- bcrypt hash of 'admin123'
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Verify the user was created
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@company.com';