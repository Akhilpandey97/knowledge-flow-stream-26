-- Fix circular dependency in users table RLS policy
-- Remove the policy that uses get_current_user_role() and replace it with direct auth.uid() checks

-- Drop existing policies that cause circular dependency
DROP POLICY IF EXISTS "Users can view accessible profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update accessible profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.users;

-- Create new policies without circular dependency
CREATE POLICY "Users can view their own profile or admins can view all" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can update their own profile or admins can update all" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Users can insert their own profile or admins can insert" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id OR EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'admin'
));