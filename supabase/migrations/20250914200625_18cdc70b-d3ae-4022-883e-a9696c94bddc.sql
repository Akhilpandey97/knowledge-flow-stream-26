-- Create a handover linking exiting employee to successor for testing
-- This ensures AI insights can be properly linked and displayed

-- First, let's find or create users for testing if they don't exist
INSERT INTO public.users (id, email, role, created_at)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'arbaaz.jawed@gmail.com', 'exiting', now()),
  ('6c8d67be-46d9-4687-bfcf-56d7b99e3680', 'ap79020@gmail.com', 'successor', now())
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role;

-- Create handover linking the exiting employee to successor
INSERT INTO public.handovers (id, employee_id, successor_id, progress, created_at)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE email = 'arbaaz.jawed@gmail.com' LIMIT 1),
  (SELECT id FROM public.users WHERE email = 'ap79020@gmail.com' LIMIT 1),
  25,
  now()
)
ON CONFLICT DO NOTHING;