-- Create table for configurable AI insight titles per department
CREATE TABLE public.ai_insight_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department TEXT NOT NULL,
  revenue_title TEXT NOT NULL DEFAULT 'Revenue Growth & Retention',
  playbook_title TEXT NOT NULL DEFAULT 'AI Successor Playbook',
  critical_title TEXT NOT NULL DEFAULT 'Critical & Priority AI Insights',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(department)
);

-- Enable RLS
ALTER TABLE public.ai_insight_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read configs
CREATE POLICY "Anyone can read AI insight configs"
ON public.ai_insight_config
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify configs
CREATE POLICY "Admins can insert AI insight configs"
ON public.ai_insight_config
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update AI insight configs"
ON public.ai_insight_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete AI insight configs"
ON public.ai_insight_config
FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_insight_config_updated_at
BEFORE UPDATE ON public.ai_insight_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configs for each department
INSERT INTO public.ai_insight_config (department, revenue_title, playbook_title, critical_title) VALUES
('Sales', 'Revenue Growth & Retention', 'AI Successor Playbook', 'Critical & Priority AI Insights'),
('Engineering', 'Technical Debt & System Health', 'AI Knowledge Transfer Guide', 'Critical & Priority Technical Insights'),
('HR', 'Employee Engagement & Retention', 'AI HR Transition Playbook', 'Critical & Priority People Insights'),
('Marketing', 'Campaign Performance & Brand Growth', 'AI Marketing Playbook', 'Critical & Priority Marketing Insights'),
('Finance', 'Financial Health & Compliance', 'AI Finance Transition Guide', 'Critical & Priority Financial Insights'),
('Operations', 'Operational Efficiency & Process Health', 'AI Operations Playbook', 'Critical & Priority Operational Insights');