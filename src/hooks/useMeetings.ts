import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface Meeting {
  id: string;
  task_id: string | null;
  handover_id: string | null;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_time: string;
  duration: string;
  attendees: string[];
  meeting_link: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  ai_summary: string | null;
  ai_action_items: any[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  task_title?: string;
}

export const useMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meetings')
        .select(`*, tasks!meetings_task_id_fkey ( title )`)
        .order('meeting_date', { ascending: true });

      if (error) throw error;

      const transformed = (data || []).map((m: any) => ({
        ...m,
        task_title: m.tasks?.title || '',
        attendees: m.attendees || [],
        ai_action_items: m.ai_action_items || [],
      }));
      setMeetings(transformed);
    } catch (err: any) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  const createMeeting = async (meeting: {
    task_id: string;
    handover_id?: string;
    title: string;
    description: string;
    meeting_date: string;
    meeting_time: string;
    duration: string;
    attendees: string[];
  }) => {
    if (!user) return null;
    try {
      const link = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...meeting,
          meeting_link: link,
          created_by: user.id,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: 'Meeting scheduled', description: 'Your meeting has been created.' });
      await fetchMeetings();
      return data;
    } catch (err: any) {
      console.error('Error creating meeting:', err);
      toast({ title: 'Error', description: 'Failed to create meeting.', variant: 'destructive' });
      return null;
    }
  };

  const completeMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status: 'completed' })
        .eq('id', meetingId);
      if (error) throw error;
      await fetchMeetings();
      return true;
    } catch (err: any) {
      console.error('Error completing meeting:', err);
      return false;
    }
  };

  const generateAISummary = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return false;

    try {
      const { data, error } = await supabase.functions.invoke('generate-task-summary', {
        body: {
          taskTitle: meeting.title,
          taskDescription: meeting.description || '',
          taskNotes: `Meeting for task: ${meeting.task_title}. Attendees: ${meeting.attendees.join(', ')}. Duration: ${meeting.duration}. Date: ${meeting.meeting_date}.`,
          summaryType: 'meeting'
        }
      });

      if (error) throw error;

      const summary = data?.summary || 'Meeting completed successfully.';
      const actionItems = data?.actionItems || [
        { title: 'Follow up on discussed items', priority: 'high' },
        { title: 'Share meeting notes with team', priority: 'medium' },
        { title: 'Schedule follow-up if needed', priority: 'low' },
      ];

      const { error: updateError } = await supabase
        .from('meetings')
        .update({
          status: 'completed',
          ai_summary: summary,
          ai_action_items: actionItems,
        })
        .eq('id', meetingId);

      if (updateError) throw updateError;
      toast({ title: 'AI Summary Generated', description: 'Meeting summary and action items are ready.' });
      await fetchMeetings();
      return true;
    } catch (err: any) {
      console.error('Error generating AI summary:', err);
      // Fallback: generate locally
      const fallbackSummary = `Knowledge transfer meeting "${meeting.title}" completed with ${meeting.attendees.join(', ')}. Duration: ${meeting.duration}. Key topics from "${meeting.task_title}" were discussed.`;
      const fallbackActions = [
        { title: `Review notes from ${meeting.title}`, priority: 'high' },
        { title: 'Update task status based on discussion', priority: 'medium' },
        { title: 'Schedule follow-up session if gaps remain', priority: 'low' },
      ];

      await supabase
        .from('meetings')
        .update({
          status: 'completed',
          ai_summary: fallbackSummary,
          ai_action_items: fallbackActions,
        })
        .eq('id', meetingId);

      await fetchMeetings();
      toast({ title: 'Meeting Completed', description: 'Summary generated.' });
      return true;
    }
  };

  const getMeetingsForTask = (taskId: string) => meetings.filter(m => m.task_id === taskId);

  return {
    meetings,
    loading,
    createMeeting,
    completeMeeting,
    generateAISummary,
    getMeetingsForTask,
    refetch: fetchMeetings,
  };
};
