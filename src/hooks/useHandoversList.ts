import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HandoverWithDetails {
  id: string;
  exitingEmployee: string;
  exitingEmployeeEmail: string;
  successor: string;
  successorEmail?: string;
  department: string;
  progress: number;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'review' | 'completed';
  criticalGaps: number;
  aiRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  aiRecommendation: string;
  taskCount: number;
  completedTasks: number;
  createdAt: string;
}

// Normalize department names for consistent filtering
const normalizeDepartment = (dept: string | undefined): string | undefined => {
  if (!dept) return undefined;
  const normalized = dept.toLowerCase().trim();
  if (normalized.includes('human') || normalized === 'hr') return 'HR';
  if (normalized.includes('engineering') || normalized === 'eng') return 'Engineering';
  if (normalized.includes('sales')) return 'Sales';
  if (normalized.includes('marketing')) return 'Marketing';
  return dept;
};

export const useHandoversList = (department?: string) => {
  const [handovers, setHandovers] = useState<HandoverWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const normalizedDept = normalizeDepartment(department);
      
      const { data: handoversData, error: handoversError } = await supabase
        .from('handovers')
        .select(`
          *,
          employee:users!handovers_employee_id_fkey(email, department),
          successor:users!handovers_successor_id_fkey(email, department),
          tasks(id, status)
        `)
        .order('created_at', { ascending: false });

      if (handoversError) {
        console.error('Handovers list fetch error:', handoversError);
        throw handoversError;
      }

      if (!handoversData) {
        setHandovers([]);
        return;
      }

      // Filter by department if specified
      const filteredData = normalizedDept
        ? handoversData.filter(h => {
            const empDept = normalizeDepartment(h.employee?.department);
            return empDept === normalizedDept;
          })
        : handoversData;

      const processedHandovers: HandoverWithDetails[] = filteredData.map(handover => {
        const tasks = handover.tasks || [];
        const taskCount = tasks.length;
        const completedTasks = tasks.filter((task: any) => task.status === 'completed').length;
        
        // Calculate progress based on tasks if not set
        const calculatedProgress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
        const progress = handover.progress || calculatedProgress;
        
        // Determine status based on progress
        let status: HandoverWithDetails['status'] = 'pending';
        if (progress >= 90) status = 'review';
        else if (progress > 0) status = 'in-progress';
        
        // Calculate risk level
        let aiRiskLevel: HandoverWithDetails['aiRiskLevel'] = 'low';
        const isOverdue = new Date() > new Date(handover.created_at + ' + 30 days'); // Assuming 30-day deadline
        
        if (!handover.successor_id) {
          aiRiskLevel = 'critical';
        } else if (progress < 30 || isOverdue) {
          aiRiskLevel = 'high';
        } else if (progress < 60) {
          aiRiskLevel = 'medium';
        }

        // Generate AI recommendation
        let aiRecommendation = 'Handover progressing well - monitor regularly';
        if (!handover.successor_id) {
          aiRecommendation = 'URGENT: Assign successor immediately - critical knowledge at risk';
        } else if (progress < 30) {
          aiRecommendation = 'Schedule urgent knowledge transfer sessions';
        } else if (progress < 60) {
          aiRecommendation = 'Increase handover meeting frequency';
        } else if (progress >= 90) {
          aiRecommendation = 'Ready for final review and completion';
        }

        // Calculate critical gaps (incomplete high-priority tasks)
        const criticalGaps = Math.max(0, Math.floor((100 - progress) / 20));

        return {
          id: handover.id,
          exitingEmployee: handover.employee?.email?.split('@')[0] || 'Unknown Employee',
          exitingEmployeeEmail: handover.employee?.email || '',
          successor: handover.successor?.email?.split('@')[0] || 'Not Assigned',
          successorEmail: handover.successor?.email,
          department: handover.employee?.department || 'Unassigned',
          progress,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          status,
          criticalGaps,
          aiRiskLevel,
          aiRecommendation,
          taskCount,
          completedTasks,
          createdAt: handover.created_at
        };
      });

      setHandovers(processedHandovers);

    } catch (err) {
      console.error('Error fetching handovers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch handovers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('handovers-list-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'handovers'
      }, () => {
        fetchHandovers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchHandovers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  return { handovers, loading, error, refetch: fetchHandovers };
};