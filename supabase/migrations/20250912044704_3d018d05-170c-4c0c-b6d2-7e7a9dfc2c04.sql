-- Update existing data to use the new role names
UPDATE users SET role = 'exiting' WHERE role = 'employee';
UPDATE users SET role = 'hr-manager' WHERE role = 'manager';

-- Add new check constraint with the correct roles (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['exiting'::text, 'successor'::text, 'hr-manager'::text]));
    END IF;
END $$;

-- Insert ap79020@gmail.com as HR manager
INSERT INTO users (id, email, role, created_at) VALUES 
('ap79020-0000-0000-0000-000000000001', 'ap79020@gmail.com', 'hr-manager', now())
ON CONFLICT (email) DO UPDATE SET role = 'hr-manager';