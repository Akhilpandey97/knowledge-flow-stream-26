-- First, update legacy roles to match expected constraint
UPDATE public.users SET role = 'hr-manager' WHERE role = 'manager';
UPDATE public.users SET role = 'exiting' WHERE role = 'employee';

-- Drop the existing constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with admin role included
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role IN ('exiting', 'successor', 'hr-manager', 'admin'));

-- Update ap79020@gmail.com to admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'ap79020@gmail.com';

-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users; 
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert new users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create security definer function to get current user role (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view accessible profiles" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (public.get_current_user_role() = 'admin' OR auth.uid() = id);

CREATE POLICY "Users can insert profiles" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (public.get_current_user_role() = 'admin' OR auth.uid() = id);

CREATE POLICY "Users can update accessible profiles" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (public.get_current_user_role() = 'admin' OR auth.uid() = id);