
-- Create meetings table for persisting knowledge transfer meetings
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  handover_id UUID REFERENCES public.handovers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration TEXT NOT NULL DEFAULT '45 min',
  attendees TEXT[] DEFAULT '{}',
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  ai_summary TEXT,
  ai_action_items JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read meetings
CREATE POLICY "Authenticated users can view meetings" ON public.meetings FOR SELECT USING (true);

-- Allow authenticated users to create meetings
CREATE POLICY "Authenticated users can create meetings" ON public.meetings FOR INSERT WITH CHECK (true);

-- Allow authenticated users to update meetings
CREATE POLICY "Authenticated users can update meetings" ON public.meetings FOR UPDATE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
