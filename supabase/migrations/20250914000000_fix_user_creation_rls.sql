-- Fix user creation RLS policy to allow admin users to create profiles
-- even if they don't have a profile in the users table yet

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can insert profiles" ON public.users;

-- Create a more robust policy that handles admin user creation properly
CREATE POLICY "Users can insert profiles" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow if the current user has admin role in the users table
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  OR 
  -- Allow if inserting their own profile
  auth.uid() = id
  OR
  -- Allow service role (used by edge functions)
  auth.jwt() ->> 'role' = 'service_role'
);

-- Also update the get_current_user_role function to handle edge cases better
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid()),
    'unauthenticated'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Ensure ap79020@gmail.com has admin role (in case it was missed)
INSERT INTO public.users (id, email, role) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'ap79020@gmail.com' LIMIT 1),
  'ap79020@gmail.com',
  'admin'
) ON CONFLICT (id) DO UPDATE SET role = 'admin';