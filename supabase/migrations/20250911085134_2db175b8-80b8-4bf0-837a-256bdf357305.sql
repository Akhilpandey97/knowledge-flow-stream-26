-- Drop the existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the correct constraint with the roles matching our TypeScript types
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['exiting'::text, 'successor'::text, 'hr-manager'::text]));

-- Update existing users with correct roles
UPDATE users SET role = 'exiting' WHERE email = 'john.doe@company.com';
UPDATE users SET role = 'hr-manager' WHERE email = 'hr@company.com';
UPDATE users SET role = 'successor' WHERE email = 'arbaaz.jawed@gmail.com';

-- Insert ap79020@gmail.com as HR manager
INSERT INTO users (id, email, role, created_at) VALUES 
('ap79020-0000-0000-0000-000000000001', 'ap79020@gmail.com', 'hr-manager', now())
ON CONFLICT (email) DO UPDATE SET role = 'hr-manager';