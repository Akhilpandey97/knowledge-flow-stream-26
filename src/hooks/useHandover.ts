import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { HandoverTask } from '@/types/handover';
import { toast } from '@/hooks/use-toast';

export const useHandover = () => {
  const [tasks, setTasks] = useState<HandoverTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTemplateApplying, setIsTemplateApplying] = useState(false);
  const [handoverId, setHandoverId] = useState<string | null>(null);
  const { user } = useAuth();

  const createHandoverWithTemplate = useCallback(async (successorId?: string) => {
    if (!user || isTemplateApplying) return null;
    
    try {
      setIsTemplateApplying(true);
      console.log('Creating/updating handover with template for user:', user.id);
      
      // Check for existing handovers first
      const { data: existingHandovers, error: fetchError } = await supabase
        .from('handovers')
        .select(`
          *,
          tasks (*)
        `)
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching existing handovers:', fetchError);
        // Continue with creation if fetch fails
      }

      let handover;
      
      if (existingHandovers && existingHandovers.length > 0) {
        // Get the most recent handover
        const mostRecentHandover = existingHandovers[0];
        
        // If the most recent handover has no tasks, use it and apply template
        if (!mostRecentHandover.tasks || mostRecentHandover.tasks.length === 0) {
          console.log('Using existing handover without tasks:', mostRecentHandover.id);
          
          // Update successor if provided
          if (successorId && successorId !== mostRecentHandover.successor_id) {
            const { error: updateError } = await supabase
              .from('handovers')
              .update({ successor_id: successorId })
              .eq('id', mostRecentHandover.id);
              
            if (updateError) {
              console.error('Error updating successor:', updateError);
            }
          }
          
          handover = { ...mostRecentHandover, successor_id: successorId || mostRecentHandover.successor_id };
        } else {
          // Most recent handover has tasks, don't create new one or apply template again
          console.log('Most recent handover has', mostRecentHandover.tasks.length, 'tasks - not applying template again');
          
          handover = mostRecentHandover;
          
          // Update successor if provided and different
          if (successorId && successorId !== mostRecentHandover.successor_id) {
            const { error: updateError } = await supabase
              .from('handovers')
              .update({ successor_id: successorId })
              .eq('id', mostRecentHandover.id);
              
            if (updateError) {
              console.error('Error updating successor:', updateError);
            } else {
              handover.successor_id = successorId;
            }
          }
          
          // Return existing handover - no need to apply template again
          return handover;
        }
      } else {
        // No existing handovers, create a new one
        console.log('Creating new handover');
        const { data: newHandover, error: handoverError } = await supabase
          .from('handovers')
          .insert({
            employee_id: user.id,
            successor_id: successorId || null,
            progress: 0
          })
          .select()
          .single();

        if (handoverError) throw handoverError;
        handover = newHandover;
      }

      // Apply template to handover (for new handovers or existing ones without tasks)
      const { data: userData } = await supabase
        .from('users')
        .select('role, department')
        .eq('id', user.id)
        .single();

      if (userData?.role) {
        // Find appropriate template for the user's role and department
        let templatesQuery = supabase
          .from('checklist_templates')
          .select('id')
          .eq('role', userData.role)
          .eq('is_active', true);

        // If user has a department, try to find a template for that department first
        if (userData.department) {
          templatesQuery = templatesQuery.eq('department', userData.department);
        }

        const { data: templates } = await templatesQuery.limit(1);

        if (templates && templates.length > 0) {
          // Apply the template to the handover (the DB function now prevents duplicates)
          console.log('Applying template to handover:', handover.id);
          const { error: templateError } = await supabase.rpc('apply_checklist_template', {
            p_handover_id: handover.id,
            p_template_id: templates[0].id
          });

          if (templateError) {
            console.error('Error applying template:', templateError);
            // Don't throw error, handover was created/updated successfully
          } else {
            console.log('Template applied successfully');
            // Refresh tasks after template application
            await fetchHandoverData();
          }
        }
      }

      return handover;
    } catch (error) {
      console.error('Error creating/updating handover:', error);
      throw error;
    } finally {
      setIsTemplateApplying(false);
    }
  }, [user, isTemplateApplying]);

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
        // Select the most recent handover that has tasks, or the most recent one if none have tasks
        const handoverWithTasks = handovers
          .filter(h => h.tasks && h.tasks.length > 0)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const handover = handoverWithTasks || handovers
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        console.log('Selected handover:', handover.id, 'with', handover.tasks?.length || 0, 'tasks');
        setHandoverId(handover.id);
        
        let mappedTasks: HandoverTask[] = handover.tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          category: getCategoryFromTitle(task.title),
          status: task.status === 'done' ? 'completed' : 'pending',
          priority: getPriorityFromStatus(task.status),
          notes: '', // Will be populated from notes table
          dueDate: task.due_date || undefined,
          successorAcknowledged: task.successor_acknowledged || false,
          successorAcknowledgedAt: task.successor_acknowledged_at || undefined
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

  const acknowledgeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          successor_acknowledged: true,
          successor_acknowledged_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, successorAcknowledged: true, successorAcknowledgedAt: new Date().toISOString() } 
          : task
      ));

      toast({
        title: "KT Acknowledged",
        description: "You have acknowledged the knowledge transfer for this task.",
      });

      return true;
    } catch (err: any) {
      console.error('Error acknowledging task:', err);
      toast({
        title: "Error",
        description: "Failed to acknowledge the task. Please try again.",
        variant: "destructive"
      });
      return false;
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
    handoverId,
    updateTask,
    acknowledgeTask,
    refetch: fetchHandoverData,
    createHandoverWithTemplate
  };
};