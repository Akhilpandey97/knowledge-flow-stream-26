-- Secure function to list successor candidates visible to exiting employees and HR managers
create or replace function public.list_successor_candidates()
returns table (
  id uuid,
  email text,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email, u.role
  from public.users u
  where u.role <> 'exiting'
    and u.id <> auth.uid()
    and (
      public.is_admin(auth.uid())
      or public.get_current_user_role() in ('exiting', 'hr-manager')
    );
$$;

-- Ensure only authenticated clients can execute this RPC
grant execute on function public.list_successor_candidates() to authenticated;