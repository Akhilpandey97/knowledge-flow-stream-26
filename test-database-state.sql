-- Test script to validate handover Auth ID associations
-- This script tests the functionality we've implemented

-- Test 1: Check if our new functions exist
SELECT 
  routine_name, 
  routine_type, 
  external_language,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'sync_handover_auth_ids',
    'handle_user_auth_id_change', 
    'ensure_handover_auth_consistency',
    'admin_sync_handover_auth_ids'
  )
ORDER BY routine_name;

-- Test 2: Check current state of handovers table
SELECT 
  h.id,
  h.employee_id,
  h.successor_id,
  e.email as employee_email,
  s.email as successor_email,
  h.progress
FROM handovers h
LEFT JOIN users e ON e.id = h.employee_id
LEFT JOIN users s ON s.id = h.successor_id
ORDER BY h.created_at DESC
LIMIT 10;

-- Test 3: Check for potential ID mismatches (users with same email but different IDs)
SELECT 
  email,
  COUNT(*) as id_count,
  ARRAY_AGG(id) as user_ids
FROM users 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;

-- Test 4: Check if handovers reference non-existent users
SELECT 
  h.id as handover_id,
  h.employee_id,
  h.successor_id,
  CASE WHEN e.id IS NULL THEN 'Missing employee' ELSE 'Employee found' END as employee_status,
  CASE WHEN s.id IS NULL THEN 'Missing successor' ELSE 'Successor found' END as successor_status
FROM handovers h
LEFT JOIN users e ON e.id = h.employee_id
LEFT JOIN users s ON s.id = h.successor_id
WHERE e.id IS NULL OR s.id IS NULL;

-- Test 5: Check trigger existence
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_handover_on_user_update';

-- Test 6: Show current RLS policies for relevant tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'handovers')
ORDER BY tablename, policyname;