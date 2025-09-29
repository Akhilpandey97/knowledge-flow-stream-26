import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HandoverTask } from '@/types/handover';
import { toast } from '@/hooks/use-toast';

export const useHandover = () => {
  const [tasks, setTasks] = useState<HandoverTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createHandoverWithTemplate = async (successorId?: string) => {
    if (!user) return null;
    
    try {
      // Create the handover first
      const { data: handover, error: handoverError } = await supabase
        .from('handovers')
        .insert({
          employee_id: user.id,
          successor_id: successorId || null,
          progress: 0
        })
        .select()
        .single();

      if (handoverError) throw handoverError;

      // Get user's current role and department (if available)
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role) {
        // Find appropriate template for the user's role
        const { data: templates } = await supabase
          .from('checklist_templates')
          .select('id')
          .eq('role', userData.role)
          .eq('is_active', true)
          .limit(1);

        if (templates && templates.length > 0) {
          // Apply the template to the handover
          const { error: templateError } = await supabase.rpc('apply_checklist_template', {
            p_handover_id: handover.id,
            p_template_id: templates[0].id
          });

          if (templateError) {
            console.error('Error applying template:', templateError);
            // Don't throw error, handover was created successfully
          }
        }
      }

      return handover;
    } catch (error) {
      console.error('Error creating handover:', error);
      throw error;
    }
  };

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

      if (handoverError) {
        console.error('Error fetching handovers:', handoverError);
        // If there's an error, just set empty tasks instead of throwing
        setTasks([]);
        return;
      }

      if (handovers && handovers.length > 0) {
        const handover = handovers[0];
        let mappedTasks: HandoverTask[] = handover.tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          category: getCategoryFromTitle(task.title),
          status: task.status === 'done' ? 'completed' : 'pending',
          priority: getPriorityFromStatus(task.status),
          notes: '', // Will be populated from notes table
          dueDate: task.due_date || undefined
        })) || [];
        
        // Fetch notes for all tasks
        if (mappedTasks.length > 0) {
          const taskIds = mappedTasks.map(task => task.id);
          const { data: notes } = await supabase
            .from('notes')
            .select('task_id, content, created_at')
            .in('task_id', taskIds)
            .order('created_at', { ascending: true });
          
          // Aggregate notes by task
          if (notes) {
            const notesByTask: Record<string, string[]> = {};
            notes.forEach(note => {
              if (!notesByTask[note.task_id]) {
                notesByTask[note.task_id] = [];
              }
              notesByTask[note.task_id].push(note.content);
            });
            
            // Add notes to tasks
            mappedTasks = mappedTasks.map(task => ({
              ...task,
              notes: notesByTask[task.id]?.join('\n\n') || ''
            }));
          }
        }
        
        setTasks(mappedTasks);
      } else {
        // No handovers found, set empty tasks
        setTasks([]);
      }
    } catch (err: any) {
      console.error('Error fetching handover data:', err);
      // Set empty tasks instead of showing error to user
      setTasks([]);
      setError(null); // Clear any previous errors
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<HandoverTask>) => {
    try {
      // Handle status updates
      if (updates.status) {
        const statusValue = updates.status === 'completed' ? 'done' : 'pending';
        const { error } = await supabase
          .from('tasks')
          .update({ status: statusValue })
          .eq('id', taskId);
        if (error) throw error;
      }

      // Handle notes updates - insert into notes table
      if (updates.notes && user) {
        const { error } = await supabase
          .from('notes')
          .insert({
            task_id: taskId,
            content: updates.notes,
            created_by: user.id
          });
        if (error) throw error;
      }

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
    refetch: fetchHandoverData,
    createHandoverWithTemplate
  };
};