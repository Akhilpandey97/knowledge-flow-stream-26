-- Add handover_id field to ai_knowledge_insights_complex table
-- This field is required for the receive-ai-insights-webhook function

ALTER TABLE public.ai_knowledge_insights_complex 
ADD COLUMN handover_id UUID;

-- Add foreign key constraint to reference handovers table
ALTER TABLE public.ai_knowledge_insights_complex 
ADD CONSTRAINT ai_knowledge_insights_complex_handover_id_fkey 
FOREIGN KEY (handover_id) REFERENCES public.handovers(id);

-- Add index for better query performance on handover_id
CREATE INDEX idx_ai_knowledge_insights_complex_handover_id 
ON public.ai_knowledge_insights_complex(handover_id);

-- Update RLS policies to include handover_id access patterns if needed
-- The existing policies should still work, but we may want to add handover-specific access later