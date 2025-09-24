-- Create activity_logs table for system activity tracking (if not exists)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity_logs if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs'
  ) THEN
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for activity logs (drop and recreate to ensure correct policies)
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    user_id, action, resource_type, resource_id, details, ip_address, user_agent
  ) VALUES (
    COALESCE(p_user_id, auth.uid()), p_action, p_resource_type, p_resource_id, p_details, p_ip_address, p_user_agent
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;