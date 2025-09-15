-- Migration to fix handover Auth ID associations
-- This addresses the issue where handovers table may reference incorrect user IDs
-- instead of proper Supabase Auth IDs

-- Step 1: Create a function to sync handovers with correct Auth IDs
CREATE OR REPLACE FUNCTION public.sync_handover_auth_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  old_id UUID;
  auth_id UUID;
BEGIN
  -- Log start of sync process
  RAISE LOG 'Starting handover Auth ID sync process';
  
  -- Loop through all users and find cases where handovers reference incorrect IDs
  FOR user_record IN 
    SELECT DISTINCT u.id as auth_id, u.email, h.employee_id, h.successor_id
    FROM public.users u
    LEFT JOIN public.handovers h ON (u.id = h.employee_id OR u.id = h.successor_id)
    WHERE u.email IS NOT NULL
  LOOP
    -- Check if there are handovers with different IDs for the same email
    -- This would indicate an Auth ID mismatch situation
    
    -- Find handovers that reference this user by email but with wrong ID
    FOR old_id IN
      SELECT DISTINCT h2.employee_id 
      FROM public.handovers h2
      JOIN public.users u2 ON u2.id = h2.employee_id
      WHERE u2.email = user_record.email 
        AND u2.id != user_record.auth_id
        AND user_record.auth_id IS NOT NULL
    LOOP
      -- Update employee_id references
      UPDATE public.handovers 
      SET employee_id = user_record.auth_id
      WHERE employee_id = old_id;
      
      RAISE LOG 'Updated handover employee_id from % to % for email %', 
        old_id, user_record.auth_id, user_record.email;
    END LOOP;
    
    -- Find handovers that reference this user as successor by email but with wrong ID
    FOR old_id IN
      SELECT DISTINCT h2.successor_id 
      FROM public.handovers h2
      JOIN public.users u2 ON u2.id = h2.successor_id
      WHERE u2.email = user_record.email 
        AND u2.id != user_record.auth_id
        AND user_record.auth_id IS NOT NULL
    LOOP
      -- Update successor_id references
      UPDATE public.handovers 
      SET successor_id = user_record.auth_id
      WHERE successor_id = old_id;
      
      RAISE LOG 'Updated handover successor_id from % to % for email %', 
        old_id, user_record.auth_id, user_record.email;
    END LOOP;
  END LOOP;
  
  RAISE LOG 'Completed handover Auth ID sync process';
END;
$$;

-- Step 2: Create a trigger function to automatically maintain handover consistency
CREATE OR REPLACE FUNCTION public.handle_user_auth_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a user record is updated and the ID changes, update handovers
  IF OLD.id IS DISTINCT FROM NEW.id AND OLD.email = NEW.email THEN
    -- Update handovers that reference the old ID as employee
    UPDATE public.handovers 
    SET employee_id = NEW.id
    WHERE employee_id = OLD.id;
    
    -- Update handovers that reference the old ID as successor
    UPDATE public.handovers 
    SET successor_id = NEW.id
    WHERE successor_id = OLD.id;
    
    RAISE LOG 'Auto-updated handover references from % to % for user %', 
      OLD.id, NEW.id, NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger to automatically sync handovers when users are updated
DROP TRIGGER IF EXISTS trigger_sync_handover_on_user_update ON public.users;
CREATE TRIGGER trigger_sync_handover_on_user_update
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_auth_id_change();

-- Step 4: Create a function to handle new user creation with handover associations
CREATE OR REPLACE FUNCTION public.ensure_handover_auth_consistency(user_email TEXT, auth_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Check if there's an existing user with this email but different ID
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = user_email AND id != auth_user_id
  LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Update handovers to use the correct Auth ID
    UPDATE public.handovers 
    SET employee_id = auth_user_id
    WHERE employee_id = existing_user_id;
    
    UPDATE public.handovers 
    SET successor_id = auth_user_id
    WHERE successor_id = existing_user_id;
    
    RAISE LOG 'Updated handovers for user % from old ID % to Auth ID %', 
      user_email, existing_user_id, auth_user_id;
  END IF;
END;
$$;

-- Step 5: Run the sync function to fix existing data
SELECT public.sync_handover_auth_ids();

-- Step 6: Create an RPC function for manual sync operations (admin use)
CREATE OR REPLACE FUNCTION public.admin_sync_handover_auth_ids()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_count INTEGER := 0;
  user_record RECORD;
  old_id UUID;
BEGIN
  -- Check if the calling user is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Run the sync process and count changes
  FOR user_record IN 
    SELECT DISTINCT u.id as auth_id, u.email, h.employee_id, h.successor_id
    FROM public.users u
    LEFT JOIN public.handovers h ON (u.id = h.employee_id OR u.id = h.successor_id)
    WHERE u.email IS NOT NULL
  LOOP
    -- Count updates for employee_id
    FOR old_id IN
      SELECT DISTINCT h2.employee_id 
      FROM public.handovers h2
      JOIN public.users u2 ON u2.id = h2.employee_id
      WHERE u2.email = user_record.email 
        AND u2.id != user_record.auth_id
        AND user_record.auth_id IS NOT NULL
    LOOP
      UPDATE public.handovers 
      SET employee_id = user_record.auth_id
      WHERE employee_id = old_id;
      
      result_count := result_count + 1;
    END LOOP;
    
    -- Count updates for successor_id
    FOR old_id IN
      SELECT DISTINCT h2.successor_id 
      FROM public.handovers h2
      JOIN public.users u2 ON u2.id = h2.successor_id
      WHERE u2.email = user_record.email 
        AND u2.id != user_record.auth_id
        AND user_record.auth_id IS NOT NULL
    LOOP
      UPDATE public.handovers 
      SET successor_id = user_record.auth_id
      WHERE successor_id = old_id;
      
      result_count := result_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'updated_handovers', result_count,
    'message', 'Handover Auth ID sync completed'
  );
END;
$$;

-- Step 7: Add comments for documentation
COMMENT ON FUNCTION public.sync_handover_auth_ids() IS 
'Synchronizes handover table to ensure all user references use correct Supabase Auth IDs';

COMMENT ON FUNCTION public.handle_user_auth_id_change() IS 
'Trigger function that automatically updates handover references when user Auth IDs change';

COMMENT ON FUNCTION public.ensure_handover_auth_consistency(TEXT, UUID) IS 
'Ensures handover consistency when a new user is created or Auth ID is updated';

COMMENT ON FUNCTION public.admin_sync_handover_auth_ids() IS 
'Admin-only function to manually trigger handover Auth ID synchronization';