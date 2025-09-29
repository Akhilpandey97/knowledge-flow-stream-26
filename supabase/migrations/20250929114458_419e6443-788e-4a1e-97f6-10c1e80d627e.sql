-- Create form templates for insight collection
CREATE TABLE public.insight_form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form fields for insight collection
CREATE TABLE public.insight_form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.insight_form_templates(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'file', 'checkbox', 'radio')),
  field_label TEXT NOT NULL,
  field_placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_options JSONB DEFAULT '[]'::jsonb, -- For select, radio, checkbox options
  validation_rules JSONB DEFAULT '{}'::jsonb, -- For validation rules like max_length, file_types, etc.
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.insight_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_form_fields ENABLE ROW LEVEL SECURITY;

-- Create policies for insight_form_templates
CREATE POLICY "Admins can manage all insight form templates"
ON public.insight_form_templates
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view active insight form templates"
ON public.insight_form_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- Create policies for insight_form_fields  
CREATE POLICY "Admins can manage all insight form fields"
ON public.insight_form_fields
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view insight form fields for active templates"
ON public.insight_form_fields
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.insight_form_templates
    WHERE insight_form_templates.id = insight_form_fields.template_id
    AND insight_form_templates.is_active = true
  )
);

-- Create indexes for better performance
CREATE INDEX idx_insight_form_fields_template_id ON public.insight_form_fields(template_id);
CREATE INDEX idx_insight_form_fields_order ON public.insight_form_fields(template_id, order_index);

-- Create update timestamp trigger
CREATE TRIGGER update_insight_form_templates_updated_at
BEFORE UPDATE ON public.insight_form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();