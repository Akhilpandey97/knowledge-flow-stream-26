-- Step 1: Insert correct user record with auth ID (if not exists)
INSERT INTO public.users (id, email, role, created_at)
SELECT '6c8d67be-46d9-4687-bfcf-56d7b99e3680', 'arbaaz.jawed@gmail.com', 'exiting', now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = '6c8d67be-46d9-4687-bfcf-56d7b99e3680'
);

-- Step 2: Update handovers to reference correct user ID
UPDATE handovers 
SET employee_id = '6c8d67be-46d9-4687-bfcf-56d7b99e3680'
WHERE employee_id = '27b6fd65-d536-4cd9-b729-e7e5859e5289';

UPDATE handovers 
SET successor_id = '6c8d67be-46d9-4687-bfcf-56d7b99e3680'
WHERE successor_id = '27b6fd65-d536-4cd9-b729-e7e5859e5289';

-- Step 3: Delete the old incorrect user record
DELETE FROM public.users 
WHERE id = '27b6fd65-d536-4cd9-b729-e7e5859e5289';

-- Step 4: Make the RPC function more resilient
CREATE OR REPLACE FUNCTION public.list_successor_candidates()
RETURNS TABLE(id uuid, email text, role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE LOG 'list_successor_candidates: No authenticated user found';
    RETURN;
  END IF;
  
  -- Get current user role with fallback
  DECLARE
    current_role text;
  BEGIN
    SELECT u.role INTO current_role 
    FROM public.users u 
    WHERE u.id = auth.uid();
    
    -- If no role found, assume exiting user (fallback for auto-creation)
    IF current_role IS NULL THEN
      current_role := 'exiting';
    END IF;
  END;
  
  -- Return successors based on permissions
  RETURN QUERY
  SELECT u.id, u.email, u.role
  FROM public.users u
  WHERE LOWER(u.role) <> 'exiting'
    AND u.id <> auth.uid()
    AND (
      public.is_admin(auth.uid())
      OR LOWER(current_role) IN ('exiting', 'hr-manager', 'admin')
    )
  ORDER BY u.email;
END;
$$;