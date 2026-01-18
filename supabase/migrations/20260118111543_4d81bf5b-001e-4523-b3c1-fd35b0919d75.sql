-- Create help_requests table for task-level help requests
CREATE TABLE public.help_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  handover_id UUID NOT NULL REFERENCES public.handovers(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('employee', 'manager')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'resolved')),
  response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Successors can create help requests for their handovers
CREATE POLICY "Successors can create help requests"
ON public.help_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM handovers
    WHERE handovers.id = help_requests.handover_id
    AND handovers.successor_id = auth.uid()
  )
  AND auth.uid() = requester_id
);

-- Employees can view help requests for their handovers (type = employee)
CREATE POLICY "Employees can view their help requests"
ON public.help_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM handovers
    WHERE handovers.id = help_requests.handover_id
    AND handovers.employee_id = auth.uid()
  )
  AND request_type = 'employee'
);

-- Successors can view their own help requests
CREATE POLICY "Successors can view their help requests"
ON public.help_requests
FOR SELECT
USING (requester_id = auth.uid());

-- HR managers can view manager-type help requests for their department
CREATE POLICY "HR managers can view manager help requests"
ON public.help_requests
FOR SELECT
USING (
  request_type = 'manager'
  AND EXISTS (
    SELECT 1 FROM users mgr
    JOIN handovers h ON h.id = help_requests.handover_id
    JOIN users emp ON emp.id = h.employee_id
    WHERE mgr.id = auth.uid()
    AND mgr.role = 'hr-manager'
    AND mgr.department = emp.department
  )
);

-- Employees can respond to employee-type help requests
CREATE POLICY "Employees can respond to help requests"
ON public.help_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM handovers
    WHERE handovers.id = help_requests.handover_id
    AND handovers.employee_id = auth.uid()
  )
  AND request_type = 'employee'
);

-- HR managers can respond to manager-type help requests
CREATE POLICY "HR managers can respond to manager help requests"
ON public.help_requests
FOR UPDATE
USING (
  request_type = 'manager'
  AND EXISTS (
    SELECT 1 FROM users mgr
    JOIN handovers h ON h.id = help_requests.handover_id
    JOIN users emp ON emp.id = h.employee_id
    WHERE mgr.id = auth.uid()
    AND mgr.role = 'hr-manager'
    AND mgr.department = emp.department
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_help_requests_updated_at
BEFORE UPDATE ON public.help_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();