-- Create ai_knowledge_insights table to store insights from Lindy Bot
CREATE TABLE public.ai_knowledge_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL REFERENCES public.user_document_uploads(file_path) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.ai_knowledge_insights ENABLE ROW LEVEL SECURITY;

-- Users can only view their own insights
CREATE POLICY "Users can view their own AI insights" 
ON public.ai_knowledge_insights 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Service role can insert insights (for edge functions)
CREATE POLICY "Service role can insert AI insights" 
ON public.ai_knowledge_insights 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Service role can update insights (for edge functions)
CREATE POLICY "Service role can update AI insights" 
ON public.ai_knowledge_insights 
FOR UPDATE 
TO service_role
USING (true);

-- Add index for better query performance
CREATE INDEX idx_ai_knowledge_insights_user_id ON public.ai_knowledge_insights(user_id);
CREATE INDEX idx_ai_knowledge_insights_file_path ON public.ai_knowledge_insights(file_path);
CREATE INDEX idx_ai_knowledge_insights_created_at ON public.ai_knowledge_insights(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_knowledge_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_knowledge_insights_updated_at_trigger
  BEFORE UPDATE ON public.ai_knowledge_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_knowledge_insights_updated_at();