
-- Fix HR manager handover visibility: allow ALL hr-managers to see ALL handovers (global visibility)
DROP POLICY IF EXISTS "HR managers can view department handovers" ON public.handovers;
CREATE POLICY "HR managers can view all handovers"
  ON public.handovers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'hr-manager'
    )
  );

-- Also allow admins to see all handovers
DROP POLICY IF EXISTS "Admins can view all handovers" ON public.handovers;
CREATE POLICY "Admins can view all handovers"
  ON public.handovers
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Fix HR manager task visibility: allow all hr-managers to see ALL tasks
DROP POLICY IF EXISTS "HR managers can view department tasks" ON public.tasks;
CREATE POLICY "HR managers can view all tasks"
  ON public.tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('hr-manager', 'admin')
    )
  );

-- Allow admins to view all tasks
DROP POLICY IF EXISTS "Admins can view all tasks" ON public.tasks;
CREATE POLICY "Admins can view all tasks"
  ON public.tasks
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow HR managers to see ALL help requests (not just same-department)
DROP POLICY IF EXISTS "HR managers can view manager help requests" ON public.help_requests;
CREATE POLICY "HR managers can view all help requests"
  ON public.help_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('hr-manager', 'admin')
    )
  );

-- Allow HR managers to respond to ALL help requests
DROP POLICY IF EXISTS "HR managers can respond to manager help requests" ON public.help_requests;
CREATE POLICY "HR managers can respond to all help requests"
  ON public.help_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('hr-manager', 'admin')
    )
  );

-- Allow HR managers to view all users (not just same-department)
DROP POLICY IF EXISTS "HR managers can view department users" ON public.users;
CREATE POLICY "HR managers can view all users"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users mgr
      WHERE mgr.id = auth.uid()
        AND mgr.role = 'hr-manager'
    )
  );

-- Allow HR managers to view all notes (for task inspection)
DROP POLICY IF EXISTS "HR managers can view all notes" ON public.notes;
CREATE POLICY "HR managers can view all notes"
  ON public.notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('hr-manager', 'admin')
    )
  );
