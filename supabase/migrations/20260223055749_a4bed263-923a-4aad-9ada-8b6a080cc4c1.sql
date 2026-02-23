-- Add status column to handovers for tracking closure
ALTER TABLE public.handovers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Update handovers where all tasks are done and successor acknowledged
UPDATE public.handovers h SET progress = 100 
WHERE (SELECT count(*) FROM tasks t WHERE t.handover_id = h.id) > 0
  AND (SELECT count(*) FROM tasks t WHERE t.handover_id = h.id AND t.status NOT IN ('done', 'completed')) = 0;