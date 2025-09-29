-- Clean up duplicate tasks for all handovers, keeping only one of each unique task title per handover
WITH duplicate_tasks AS (
  SELECT 
    t.*,
    ROW_NUMBER() OVER (
      PARTITION BY t.handover_id, t.title 
      ORDER BY t.created_at ASC
    ) as rn
  FROM tasks t
),
tasks_to_delete AS (
  SELECT id 
  FROM duplicate_tasks 
  WHERE rn > 1
)
DELETE FROM tasks 
WHERE id IN (SELECT id FROM tasks_to_delete);

-- Update the apply_checklist_template function to be idempotent
CREATE OR REPLACE FUNCTION public.apply_checklist_template(p_handover_id uuid, p_template_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_task_count INTEGER;
BEGIN
  -- Check if tasks already exist for this handover
  SELECT COUNT(*) INTO existing_task_count
  FROM public.tasks
  WHERE handover_id = p_handover_id;
  
  -- Only apply template if no tasks exist yet
  IF existing_task_count = 0 THEN
    -- Insert tasks from template into the handover
    INSERT INTO public.tasks (handover_id, title, description, status)
    SELECT 
      p_handover_id,
      tt.title,
      COALESCE(tt.description, ''),
      'pending'
    FROM public.checklist_template_tasks tt
    WHERE tt.template_id = p_template_id
    ORDER BY tt.order_index;
  ELSE
    -- Log that template was not applied due to existing tasks
    RAISE NOTICE 'Template not applied - handover % already has % tasks', p_handover_id, existing_task_count;
  END IF;
END;
$function$;