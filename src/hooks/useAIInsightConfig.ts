import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AIInsightConfig {
  id: string;
  department: string;
  revenue_title: string;
  playbook_title: string;
  critical_title: string;
  created_at: string;
  updated_at: string;
}

export const useAIInsightConfig = (department?: string) => {
  const [config, setConfig] = useState<AIInsightConfig | null>(null);
  const [allConfigs, setAllConfigs] = useState<AIInsightConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (department) {
        const { data, error: fetchError } = await supabase
          .from('ai_insight_config')
          .select('*')
          .eq('department', department)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        setConfig(data as AIInsightConfig | null);
      }
    } catch (err: any) {
      console.error('Error fetching AI insight config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [department]);

  const fetchAllConfigs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ai_insight_config')
        .select('*')
        .order('department');

      if (fetchError) throw fetchError;

      setAllConfigs((data as AIInsightConfig[]) || []);
    } catch (err: any) {
      console.error('Error fetching all AI insight configs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (
    configId: string, 
    updates: Partial<Pick<AIInsightConfig, 'revenue_title' | 'playbook_title' | 'critical_title'>>
  ) => {
    try {
      const { data, error: updateError } = await supabase
        .from('ai_insight_config')
        .update(updates)
        .eq('id', configId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setAllConfigs(prev => 
        prev.map(c => c.id === configId ? { ...c, ...data } as AIInsightConfig : c)
      );

      if (config?.id === configId) {
        setConfig({ ...config, ...data } as AIInsightConfig);
      }

      return data as AIInsightConfig;
    } catch (err: any) {
      console.error('Error updating AI insight config:', err);
      throw err;
    }
  }, [config]);

  useEffect(() => {
    if (department) {
      fetchConfig();
    }
  }, [department, fetchConfig]);

  return {
    config,
    allConfigs,
    loading,
    error,
    fetchConfig,
    fetchAllConfigs,
    updateConfig,
  };
};
