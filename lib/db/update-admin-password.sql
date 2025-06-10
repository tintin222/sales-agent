-- Update password for existing admin user with ID 2
-- New password: admin123

UPDATE users 
SET 
  password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfQe6rQqIRC2W',  -- bcrypt hash of 'admin123'
  role = 'admin'
WHERE id = 2;

-- Verify the update
SELECT id, email, name, role, created_at 
FROM users 
WHERE id = 2;