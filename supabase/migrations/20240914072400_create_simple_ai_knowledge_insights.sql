-- Create the ai_knowledge_insights table as requested for PostgREST API access
-- Note: This creates the simple structure specifically requested in the requirements
-- The existing complex table will be renamed to preserve existing functionality

-- First, rename the existing complex table to preserve current functionality
ALTER TABLE IF EXISTS public.ai_knowledge_insights RENAME TO public.ai_knowledge_insights_complex;

-- Create the new simple ai_knowledge_insights table as specified in requirements
CREATE TABLE public.ai_knowledge_insights (
  id SERIAL PRIMARY KEY,
  insight TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.ai_knowledge_insights ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read insights
CREATE POLICY "Allow authenticated users to read insights" 
ON public.ai_knowledge_insights 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow service role to insert and update insights (for API/edge functions)
CREATE POLICY "Service role can manage insights" 
ON public.ai_knowledge_insights 
FOR ALL 
TO service_role
USING (true);

-- Add index for better query performance on created_at
CREATE INDEX idx_ai_knowledge_insights_created_at ON public.ai_knowledge_insights(created_at DESC);

-- Add some sample data for testing PostgREST connectivity
INSERT INTO public.ai_knowledge_insights (insight) VALUES 
('AI analysis suggests improving knowledge transfer documentation for smoother handovers.'),
('Critical insight: Consider implementing automated task tracking for better handover visibility.'),
('Recommendation: Establish regular check-ins between outgoing and incoming team members.');