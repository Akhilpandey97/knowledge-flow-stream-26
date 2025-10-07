-- Add RLS policies for HR managers to view department-specific data

-- Policy: HR managers can view handovers in their department
CREATE POLICY "HR managers can view department handovers"
ON public.handovers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.role = 'hr-manager'
      AND users.department IN (
        SELECT u.department FROM public.users u
        WHERE u.id = handovers.employee_id
      )
  )
);

-- Policy: HR managers can view tasks for handovers in their department
CREATE POLICY "HR managers can view department tasks"
ON public.tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.handovers h
    JOIN public.users emp ON h.employee_id = emp.id
    JOIN public.users mgr ON mgr.id = auth.uid()
    WHERE h.id = tasks.handover_id
      AND mgr.role = 'hr-manager'
      AND mgr.department = emp.department
  )
);

-- Policy: HR managers can view users in their department
CREATE POLICY "HR managers can view department users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users mgr
    WHERE mgr.id = auth.uid()
      AND mgr.role = 'hr-manager'
      AND mgr.department = users.department
  )
);