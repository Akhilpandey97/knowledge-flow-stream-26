
-- Create tenants table
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text,
  logo_url text,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  max_users integer NOT NULL DEFAULT 50,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Admins can manage tenants
CREATE POLICY "Admins can view all tenants"
  ON public.tenants FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tenants"
  ON public.tenants FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tenants"
  ON public.tenants FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Add tenant_id to users table
ALTER TABLE public.users ADD COLUMN tenant_id uuid REFERENCES public.tenants(id);

-- Create index for faster tenant lookups
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);

-- Trigger for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
