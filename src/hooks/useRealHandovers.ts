import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealHandover {
  id: string;
  employee_id: string;
  successor_id: string | null;
  progress: number;
  created_at: string;
  employee: {
    email: string;
    department: string | null;
  } | null;
  successor: {
    email: string;
    department: string | null;
  } | null;
  tasks: {
    id: string;
    status: string;
  }[];
}

export const useRealHandovers = () => {
  const [handovers, setHandovers] = useState<RealHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('handovers')
        .select(`
          *,
          employee:users!handovers_employee_id_fkey(email, department),
          successor:users!handovers_successor_id_fkey(email, department),
          tasks(id, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHandovers(data || []);
    } catch (err) {
      console.error('Error fetching handovers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch handovers');
    } finally {
      setLoading(false);
    }
  };

  const createHandover = async (employeeId: string, successorId?: string) => {
    try {
      const { data, error } = await supabase
        .from('handovers')
        .insert({
          employee_id: employeeId,
          successor_id: successorId || null,
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the list
      await fetchHandovers();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating handover:', err);
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create handover' };
    }
  };

  useEffect(() => {
    fetchHandovers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('handovers-management-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'handovers'
      }, () => {
        fetchHandovers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { handovers, loading, error, refetch: fetchHandovers, createHandover };
};