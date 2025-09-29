-- Clean up duplicate handovers, keeping only the most recent one with tasks for each user
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
handovers_to_delete AS (
  SELECT id 
  FROM ranked_handovers 
  WHERE rn > 1
)
DELETE FROM handovers 
WHERE id IN (SELECT id FROM handovers_to_delete);