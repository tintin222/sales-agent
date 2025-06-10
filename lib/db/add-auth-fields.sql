-- Add password hash to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update the role column to have proper constraints
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'sales_rep', 'manager'));

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);