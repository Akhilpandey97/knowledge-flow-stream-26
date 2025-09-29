-- Assign the successor user to the most recent handover with tasks
UPDATE handovers 
SET successor_id = 'e0f4d511-d10d-41df-b5f8-055d42564d39'  -- successor@handover.com
WHERE id = 'b3d47b17-b014-4f7e-8306-7c469f46d4fb'  -- Most recent handover with tasks
AND successor_id IS NULL;