-- Create table for caching AI task insights
CREATE TABLE public.ai_task_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  insights TEXT NOT NULL,
  next_action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_next_actions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id)
);

-- Enable RLS
ALTER TABLE public.ai_task_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read insights for tasks in their handovers
CREATE POLICY "Users can view AI insights for their handover tasks"
ON public.ai_task_insights
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.handovers h ON t.handover_id = h.id
    WHERE t.id = ai_task_insights.task_id
    AND (h.employee_id = auth.uid() OR h.successor_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'hr-manager')
  )
);

-- Policy: Allow authenticated users to insert insights for their tasks
CREATE POLICY "Users can create AI insights for their tasks"
ON public.ai_task_insights
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.handovers h ON t.handover_id = h.id
    WHERE t.id = task_id
    AND (h.employee_id = auth.uid() OR h.successor_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'hr-manager')
  )
);

-- Policy: Allow users to update insights for their tasks  
CREATE POLICY "Users can update AI insights for their tasks"
ON public.ai_task_insights
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.handovers h ON t.handover_id = h.id
    WHERE t.id = ai_task_insights.task_id
    AND (h.employee_id = auth.uid() OR h.successor_id = auth.uid())
  )
  OR
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin', 'hr-manager')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_task_insights_updated_at
BEFORE UPDATE ON public.ai_task_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();