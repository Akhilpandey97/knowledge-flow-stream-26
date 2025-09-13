-- First, update legacy roles to match expected constraint
UPDATE public.users SET role = 'hr-manager' WHERE role = 'manager';
UPDATE public.users SET role = 'exiting' WHERE role = 'employee';

-- Now drop the existing constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with admin role included
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('exiting', 'successor', 'hr-manager', 'admin'));

-- Update ap79020@gmail.com to admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'ap79020@gmail.com';

-- Add RLS policies for admin users to manage all users
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
  ) OR auth.uid() = id
);

CREATE POLICY "Admins can insert new users" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
  ) OR auth.uid() = id
);

CREATE POLICY "Admins can update all users" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.users admin_user 
    WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin'
  ) OR auth.uid() = id
);

-- Update existing policies to work with new admin permissions by dropping old restrictive ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users; 
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;