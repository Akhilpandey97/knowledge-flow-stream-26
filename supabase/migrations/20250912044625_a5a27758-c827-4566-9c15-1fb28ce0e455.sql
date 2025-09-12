-- First, update existing data to use the new role names before changing constraint
UPDATE users SET role = 'exiting' WHERE role = 'employee';
UPDATE users SET role = 'hr-manager' WHERE role = 'manager';

-- Now drop the existing check constraint  
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Add new check constraint with the correct roles
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['exiting'::text, 'successor'::text, 'hr-manager'::text]));

-- Insert ap79020@gmail.com as HR manager
INSERT INTO users (id, email, role, created_at) VALUES 
('ap79020-0000-0000-0000-000000000001', 'ap79020@gmail.com', 'hr-manager', now())
ON CONFLICT (email) DO UPDATE SET role = 'hr-manager';