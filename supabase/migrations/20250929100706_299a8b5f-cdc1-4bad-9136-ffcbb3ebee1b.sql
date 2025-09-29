-- Add department field to users table
ALTER TABLE public.users 
ADD COLUMN department text;

-- Create an enum for standardized departments
CREATE TYPE public.department_type AS ENUM (
  'Sales',
  'Engineering', 
  'HR',
  'Marketing',
  'Finance',
  'Operations'
);

-- Update users table to use the enum (optional, can be text for flexibility)
-- ALTER TABLE public.users 
-- ALTER COLUMN department TYPE department_type USING department::department_type;

-- Add some sample department values for existing users if needed
-- This is optional - you may want to set these manually
-- UPDATE public.users SET department = 'Engineering' WHERE department IS NULL;