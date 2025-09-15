-- Fix the list_successor_candidates function to work without missing is_admin function
-- This replaces the broken function with a working version

CREATE OR REPLACE FUNCTION public.list_successor_candidates()
RETURNS TABLE (
  id uuid,
  email text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.role
  FROM public.users u
  WHERE u.role <> 'exiting'
    AND u.id <> auth.uid()
    AND (
      -- Check if current user is admin directly
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
      OR 
      -- Check if current user is exiting employee or hr-manager
      (SELECT role FROM public.users WHERE id = auth.uid()) IN ('exiting', 'hr-manager')
    );
$$;

-- Ensure only authenticated clients can execute this RPC
GRANT EXECUTE ON FUNCTION public.list_successor_candidates() TO authenticated;