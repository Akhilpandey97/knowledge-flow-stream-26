import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HandoverStats {
  totalHandovers: number;
  completedHandovers: number;
  inProgressHandovers: number;
  overallProgress: number;
  highRiskCount: number;
  exitingEmployees: number;
  successorsAssigned: number;
  departmentDistribution: { [key: string]: number };
}

// Normalize department names for consistent filtering
const normalizeDepartment = (dept: string | undefined): string | undefined => {
  if (!dept) return undefined;
  const normalized = dept.toLowerCase().trim();
  // Map common variations
  if (normalized.includes('human') || normalized === 'hr') return 'HR';
  if (normalized.includes('engineering') || normalized === 'eng') return 'Engineering';
  if (normalized.includes('sales')) return 'Sales';
  if (normalized.includes('marketing')) return 'Marketing';
  return dept; // Return original if no match
};

export const useHandoverStats = (department?: string) => {
  const [stats, setStats] = useState<HandoverStats>({
    totalHandovers: 0,
    completedHandovers: 0,
    inProgressHandovers: 0,
    overallProgress: 0,
    highRiskCount: 0,
    exitingEmployees: 0,
    successorsAssigned: 0,
    departmentDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const normalizedDept = normalizeDepartment(department);
      
      // Fetch handovers with related user data
      let query = supabase
        .from('handovers')
        .select(`
          *,
          employee:users!handovers_employee_id_fkey(department, email),
          successor:users!handovers_successor_id_fkey(department, email),
          tasks(id, status)
        `);

      const { data: handovers, error: handoversError } = await query;

      if (handoversError) {
        console.error('Handovers fetch error:', handoversError);
        throw handoversError;
      }

      // Filter by department on client side if specified
      const filteredHandovers = normalizedDept 
        ? (handovers || []).filter(h => {
            const empDept = normalizeDepartment(h.employee?.department);
            return empDept === normalizedDept;
          })
        : (handovers || []);

      const totalHandovers = filteredHandovers.length;
      const exitingEmployees = filteredHandovers.length;
      const successorsAssigned = filteredHandovers.filter(h => h.successor_id).length;
      
      // Calculate completion status based on progress
      // Recalculate progress from tasks (DB progress field may be stale)
      const recalculated = filteredHandovers.map(h => {
        const tasks = (h as any).tasks || [];
        const taskCount = tasks.length;
        const doneTasks = tasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length;
        const calcProgress = taskCount > 0 ? Math.round((doneTasks / taskCount) * 100) : (h.progress || 0);
        return { ...h, _progress: calcProgress };
      });

      const completedHandovers = recalculated.filter(h => h._progress >= 90).length;
      const inProgressHandovers = recalculated.filter(h => h._progress < 90 && h._progress > 0).length;
      
      // Calculate overall progress
      const overallProgress = recalculated.length > 0 
        ? Math.round(recalculated.reduce((sum, h) => sum + h._progress, 0) / recalculated.length)
        : 0;

      // Calculate high risk based on low progress and missing successors
      const highRiskCount = recalculated.filter(h => 
        h._progress < 50 || !h.successor_id
      ).length;

      // Department distribution
      const departmentDistribution: { [key: string]: number } = {};
      filteredHandovers.forEach(h => {
        const dept = h.employee?.department || 'Unassigned';
        departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
      });

      setStats({
        totalHandovers,
        completedHandovers,
        inProgressHandovers,
        overallProgress,
        highRiskCount,
        exitingEmployees,
        successorsAssigned,
        departmentDistribution
      });

    } catch (err) {
      console.error('Error fetching handover stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('handover-stats-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'handovers'
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department]);

  return { stats, loading, error, refetch: fetchStats };
};