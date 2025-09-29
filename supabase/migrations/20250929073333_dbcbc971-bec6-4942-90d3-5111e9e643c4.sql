-- Create checklist templates table for role-specific KT checklists
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL, -- 'exiting', 'successor', 'hr-manager', 'admin'
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template tasks table
CREATE TABLE public.checklist_template_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for checklist_templates
CREATE POLICY "Admins can manage all templates" 
ON public.checklist_templates 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "HR managers can view and use templates" 
ON public.checklist_templates 
FOR SELECT 
USING (get_current_user_role() IN ('hr-manager', 'admin'));

CREATE POLICY "Users can view templates for their role" 
ON public.checklist_templates 
FOR SELECT 
USING (is_active = true);

-- RLS policies for checklist_template_tasks
CREATE POLICY "Admins can manage all template tasks" 
ON public.checklist_template_tasks 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view template tasks" 
ON public.checklist_template_tasks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.checklist_templates 
  WHERE id = template_id AND is_active = true
));

-- Add trigger for updated_at
CREATE TRIGGER update_checklist_templates_updated_at
BEFORE UPDATE ON public.checklist_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default role-specific templates
INSERT INTO public.checklist_templates (name, description, role, department) VALUES
('Sales Representative Handover', 'Complete handover checklist for sales representatives', 'exiting', 'Sales'),
('Project Manager Handover', 'Comprehensive handover for project managers', 'exiting', 'Engineering'),
('HR Specialist Handover', 'Human resources specialist knowledge transfer', 'exiting', 'HR'),
('Marketing Manager Handover', 'Marketing department leadership transition', 'exiting', 'Marketing');

-- Insert template tasks for Sales Representative
INSERT INTO public.checklist_template_tasks (template_id, title, description, category, priority, order_index)
SELECT 
  t.id,
  task_data.title,
  task_data.description,
  task_data.category,
  task_data.priority,
  task_data.order_index
FROM public.checklist_templates t,
(VALUES
  ('Client Account Handover', 'Transfer all client account details, meeting notes, and contact information', 'Client Management', 'critical', 1),
  ('Pipeline Documentation', 'Document all active deals and pipeline opportunities', 'Sales Process', 'high', 2),
  ('CRM System Access', 'Transfer CRM access and document all custom fields and processes', 'System Access', 'high', 3),
  ('Team Introductions', 'Introduce successor to key team members and clients', 'Team Management', 'medium', 4),
  ('Territory Knowledge Transfer', 'Share insights about territory, market conditions, and competitive landscape', 'Market Intelligence', 'medium', 5)
) AS task_data(title, description, category, priority, order_index)
WHERE t.name = 'Sales Representative Handover';

-- Insert template tasks for Project Manager
INSERT INTO public.checklist_template_tasks (template_id, title, description, category, priority, order_index)
SELECT 
  t.id,
  task_data.title,
  task_data.description,
  task_data.category,
  task_data.priority,
  task_data.order_index
FROM public.checklist_templates t,
(VALUES
  ('Project Documentation', 'Document current project status, timelines, and next steps', 'Project Management', 'critical', 1),
  ('Stakeholder Communication', 'Introduce successor to all project stakeholders', 'Communication', 'high', 2),
  ('Resource Allocation', 'Transfer knowledge of team resources and budget allocation', 'Resource Management', 'high', 3),
  ('Risk Assessment Documentation', 'Document current project risks and mitigation strategies', 'Risk Management', 'high', 4),
  ('Tool and Process Training', 'Train successor on project management tools and processes', 'Training', 'medium', 5)
) AS task_data(title, description, category, priority, order_index)
WHERE t.name = 'Project Manager Handover';

-- Function to apply template to handover
CREATE OR REPLACE FUNCTION public.apply_checklist_template(
  p_handover_id UUID,
  p_template_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
END;
$$;