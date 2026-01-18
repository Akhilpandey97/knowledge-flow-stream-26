import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface HelpRequest {
  id: string;
  task_id: string;
  handover_id: string;
  requester_id: string;
  request_type: 'employee' | 'manager';
  message: string;
  status: 'pending' | 'replied' | 'resolved';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  task_title?: string;
  requester_email?: string;
  responder_email?: string;
}

export interface HelpRequestWithTask extends HelpRequest {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
  } | null;
  requester: {
    email: string;
  } | null;
}

export const useHelpRequests = (role?: 'successor' | 'employee' | 'manager') => {
  const [requests, setRequests] = useState<HelpRequestWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch help requests with task info
      const { data, error: fetchError } = await supabase
        .from('help_requests')
        .select(`
          *,
          tasks!help_requests_task_id_fkey (
            id,
            title,
            description,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data
      const transformedData: HelpRequestWithTask[] = (data || []).map((req: any) => ({
        ...req,
        task: req.tasks,
        requester: null // We'll fetch requester info separately if needed
      }));

      setRequests(transformedData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching help requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (
    taskId: string,
    handoverId: string,
    requestType: 'employee' | 'manager',
    message: string
  ) => {
    if (!user) return null;

    try {
      const { data, error: insertError } = await supabase
        .from('help_requests')
        .insert({
          task_id: taskId,
          handover_id: handoverId,
          requester_id: user.id,
          request_type: requestType,
          message: message
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'Request sent',
        description: requestType === 'employee' 
          ? 'Your question has been sent to the employee.'
          : 'Your escalation has been sent to the manager.',
      });

      await fetchRequests();
      return data;
    } catch (err: any) {
      console.error('Error creating help request:', err);
      toast({
        title: 'Error',
        description: 'Failed to send request. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const respondToRequest = async (requestId: string, response: string) => {
    if (!user) return false;

    try {
      const { error: updateError } = await supabase
        .from('help_requests')
        .update({
          response: response,
          responded_by: user.id,
          responded_at: new Date().toISOString(),
          status: 'replied'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: 'Response sent',
        description: 'Your response has been sent successfully.',
      });

      await fetchRequests();
      return true;
    } catch (err: any) {
      console.error('Error responding to help request:', err);
      toast({
        title: 'Error',
        description: 'Failed to send response. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const resolveRequest = async (requestId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('help_requests')
        .update({ status: 'resolved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: 'Request resolved',
        description: 'The help request has been marked as resolved.',
      });

      await fetchRequests();
      return true;
    } catch (err: any) {
      console.error('Error resolving help request:', err);
      toast({
        title: 'Error',
        description: 'Failed to resolve request. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get pending requests count
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return {
    requests,
    loading,
    error,
    createRequest,
    respondToRequest,
    resolveRequest,
    refetch: fetchRequests,
    pendingCount
  };
};
