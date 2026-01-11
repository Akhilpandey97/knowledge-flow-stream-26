-- Add due_date column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;