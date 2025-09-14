-- Create secure RPC function to list successor candidates
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
      public.is_admin(auth.uid())
      OR public.get_current_user_role() IN ('exiting', 'hr-manager')
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.list_successor_candidates() TO authenticated;