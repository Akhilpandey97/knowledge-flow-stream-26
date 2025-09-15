-- Step 1: Update handovers table to use correct auth ID for Arbaaz
UPDATE handovers 
SET employee_id = '6c8d67be-46d9-4687-bfcf-56d7b99e3680'
WHERE employee_id = '27b6fd65-d536-4cd9-b729-e7e5859e5289';

UPDATE handovers 
SET successor_id = '6c8d67be-46d9-4687-bfcf-56d7b99e3680'
WHERE successor_id = '27b6fd65-d536-4cd9-b729-e7e5859e5289';

-- Step 2: Now safely update the users table ID
UPDATE public.users 
SET id = '6c8d67be-46d9-4687-bfcf-56d7b99e3680'
WHERE email = 'arbaaz.jawed@gmail.com' 
AND id = '27b6fd65-d536-4cd9-b729-e7e5859e5289';

-- Step 3: Make the RPC function more resilient with better error handling and logging
CREATE OR REPLACE FUNCTION public.list_successor_candidates()
RETURNS TABLE(id uuid, email text, role text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log the current user context for debugging
  RAISE LOG 'list_successor_candidates called by user: %', auth.uid();
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE LOG 'list_successor_candidates: No authenticated user found';
    RETURN;
  END IF;
  
  -- Get current user role with error handling
  DECLARE
    current_role text;
  BEGIN
    SELECT u.role INTO current_role 
    FROM public.users u 
    WHERE u.id = auth.uid();
    
    RAISE LOG 'list_successor_candidates: Current user role: %', COALESCE(current_role, 'NULL');
    
    -- If no role found, assume exiting user (fallback)
    IF current_role IS NULL THEN
      current_role := 'exiting';
      RAISE LOG 'list_successor_candidates: No role found, defaulting to exiting';
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
  
  -- Log results count
  GET DIAGNOSTICS current_role = ROW_COUNT;
  RAISE LOG 'list_successor_candidates: Returning % candidates', current_role;
END;
$$;