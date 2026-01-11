-- Add successor_acknowledged column to tasks table
ALTER TABLE public.tasks
ADD COLUMN successor_acknowledged BOOLEAN DEFAULT FALSE;

-- Add successor_acknowledged_at timestamp column
ALTER TABLE public.tasks
ADD COLUMN successor_acknowledged_at TIMESTAMP WITH TIME ZONE;