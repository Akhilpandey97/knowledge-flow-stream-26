-- Backfill and normalize AI insights linkage
begin;

-- 1) Normalize user_id when stored as email -> set to users.id::text
update public.ai_knowledge_insights_complex a
set user_id = u.id::text
from public.users u
where a.user_id is not null
  and a.user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and lower(a.user_id) = lower(u.email);

-- 2) Backfill handover_id from user_id (match employee or successor)
update public.ai_knowledge_insights_complex a
set handover_id = h.id
from public.handovers h
where a.handover_id is null
  and a.user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and (h.employee_id::text = a.user_id or h.successor_id::text = a.user_id);

-- 3) Backfill handover_id from file_path prefix if it matches an existing handover id
update public.ai_knowledge_insights_complex a
set handover_id = h.id
from public.handovers h
where a.handover_id is null
  and a.file_path is not null
  and split_part(a.file_path, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and split_part(a.file_path, '/', 1)::uuid = h.id;

-- 4) Ensure non-null insight value for any historical rows
update public.ai_knowledge_insights_complex
set insight = coalesce(insight, insights)
where insight is null;

commit;