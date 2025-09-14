-- Fix critical RLS security issues
-- Enable RLS on tables that are missing it

-- Enable RLS on ai_knowledge_insights_complex table
ALTER TABLE public.ai_knowledge_insights_complex ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_knowledge_insights_complex
-- Users can view insights for handovers they're involved in OR their own insights
CREATE POLICY "Users can view relevant AI insights" 
ON public.ai_knowledge_insights_complex 
FOR SELECT 
USING (
  auth.uid() = user_id::uuid OR
  EXISTS (
    SELECT 1 FROM public.handovers 
    WHERE handovers.id = ai_knowledge_insights_complex.handover_id::uuid 
    AND (handovers.employee_id = auth.uid() OR handovers.successor_id = auth.uid())
  )
);

-- Admin users can insert insights (typically from webhooks)
CREATE POLICY "System can insert AI insights" 
ON public.ai_knowledge_insights_complex 
FOR INSERT 
WITH CHECK (true);

-- Enable RLS on lindi_responses table  
ALTER TABLE public.lindi_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lindi_responses
-- Users can view their own responses
CREATE POLICY "Users can view their own lindi responses" 
ON public.lindi_responses 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert their own lindi responses" 
ON public.lindi_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);