import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HandoverTask } from '@/types/handover';

export const useHandover = () => {
  const [tasks, setTasks] = useState<HandoverTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchHandoverData();
    }
  }, [user]);

  const fetchHandoverData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch handovers for the current user
      const { data: handovers, error: handoverError } = await supabase
        .from('handovers')
        .select(`
          *,
          tasks (*)
        `)
        .or(`employee_id.eq.${user.id},successor_id.eq.${user.id}`);

      if (handoverError) throw handoverError;

      if (handovers && handovers.length > 0) {
        const handover = handovers[0];
        const mappedTasks: HandoverTask[] = handover.tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          category: getCategoryFromTitle(task.title),
          isCompleted: task.status === 'done',
          priority: getPriorityFromStatus(task.status),
          notes: task.notes || ''
        })) || [];
        
        setTasks(mappedTasks);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching handover data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<HandoverTask>) => {
    try {
      const statusValue = updates.isCompleted !== undefined 
        ? (updates.isCompleted ? 'done' : 'pending')
        : undefined;

      const { error } = await supabase
        .from('tasks')
        .update({
          ...(statusValue && { status: statusValue }),
          ...(updates.notes && { notes: updates.notes })
        })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ));
    } catch (err: any) {
      console.error('Error updating task:', err);
      throw new Error('Failed to update task');
    }
  };

  const getCategoryFromTitle = (title: string): string => {
    if (title.toLowerCase().includes('client')) return 'Client Management';
    if (title.toLowerCase().includes('crm') || title.toLowerCase().includes('system')) return 'Systems & Tools';
    if (title.toLowerCase().includes('risk') || title.toLowerCase().includes('strategy')) return 'Strategic Planning';
    if (title.toLowerCase().includes('team') || title.toLowerCase().includes('introduction')) return 'Relationships';
    return 'General';
  };

  const getPriorityFromStatus = (status: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (status) {
      case 'critical': return 'critical';
      case 'done': return 'medium';
      case 'pending': return 'high';
      default: return 'medium';
    }
  };

  return {
    tasks,
    loading,
    error,
    updateTask,
    refetch: fetchHandoverData
  };
};