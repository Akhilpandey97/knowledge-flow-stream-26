-- First, move tasks from duplicate handovers to the main handover for each user
WITH ranked_handovers AS (
  SELECT 
    h.*,
    ROW_NUMBER() OVER (
      PARTITION BY h.employee_id 
      ORDER BY 
        CASE WHEN EXISTS (SELECT 1 FROM tasks t WHERE t.handover_id = h.id) THEN 0 ELSE 1 END,
        h.created_at DESC
    ) as rn
  FROM handovers h
),
main_handovers AS (
  SELECT employee_id, id as main_handover_id
  FROM ranked_handovers 
  WHERE rn = 1
),
duplicate_handovers AS (
  SELECT h.id as duplicate_id, m.main_handover_id
  FROM ranked_handovers h
  JOIN main_handovers m ON h.employee_id = m.employee_id
  WHERE h.rn > 1
)
-- Update tasks to point to the main handover
UPDATE tasks 
SET handover_id = d.main_handover_id
FROM duplicate_handovers d
WHERE tasks.handover_id = d.duplicate_id;

-- Now delete the duplicate handovers (they should have no tasks referencing them)
WITH ranked_handovers AS (
  SELECT 
    h.*,
    ROW_NUMBER() OVER (
      PARTITION BY h.employee_id 
      ORDER BY 
        CASE WHEN EXISTS (SELECT 1 FROM tasks t WHERE t.handover_id = h.id) THEN 0 ELSE 1 END,
        h.created_at DESC
    ) as rn
  FROM handovers h
)
DELETE FROM handovers 
WHERE id IN (
  SELECT id 
  FROM ranked_handovers 
  WHERE rn > 1
);