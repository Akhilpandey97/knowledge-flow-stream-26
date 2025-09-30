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
      const filteredHandovers = department 
        ? (handovers || []).filter(h => h.employee?.department === department)
        : (handovers || []);

      const totalHandovers = filteredHandovers.length;
      const exitingEmployees = filteredHandovers.length;
      const successorsAssigned = filteredHandovers.filter(h => h.successor_id).length;
      
      // Calculate completion status based on progress
      const completedHandovers = filteredHandovers.filter(h => h.progress >= 90).length;
      const inProgressHandovers = filteredHandovers.filter(h => h.progress < 90 && h.progress > 0).length;
      
      // Calculate overall progress
      const overallProgress = filteredHandovers.length > 0 
        ? Math.round(filteredHandovers.reduce((sum, h) => sum + (h.progress || 0), 0) / filteredHandovers.length)
        : 0;

      // Calculate high risk based on low progress and missing successors
      const highRiskCount = filteredHandovers.filter(h => 
        h.progress < 50 || !h.successor_id
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
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};