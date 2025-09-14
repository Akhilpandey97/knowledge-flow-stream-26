-- Fix RLS policy to handle mixed user_id types (UUID vs email)
DROP POLICY IF EXISTS "Users can view relevant AI insights" ON public.ai_knowledge_insights_complex;

-- Create safer RLS policy that handles both UUID and email formats
CREATE POLICY "Users can view relevant AI insights" 
ON public.ai_knowledge_insights_complex 
FOR SELECT 
USING (
  -- Handle UUID format user_id
  (user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND auth.uid() = user_id::uuid) OR
  -- Handle email format user_id by looking up the actual user
  (user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.email = user_id
  )) OR
  -- Handle handover-based access
  EXISTS (
    SELECT 1 FROM public.handovers 
    WHERE handovers.id = ai_knowledge_insights_complex.handover_id 
    AND (handovers.employee_id = auth.uid() OR handovers.successor_id = auth.uid())
  ) OR
  -- Handle file path prefix matching for user documents
  (file_path IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND ai_knowledge_insights_complex.file_path LIKE users.id::text || '/%'
  ))
);