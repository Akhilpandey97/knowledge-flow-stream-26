import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HandoverTask } from '@/types/handover';

export interface RevenueInsight {
  metric: string;
  value: string;
  insight: string;
}

export interface PlaybookAction {
  title: string;
  detail: string;
}

export interface CriticalItem {
  title: string;
  insight: string;
}

export interface GeneratedInsights {
  revenueInsights: RevenueInsight[];
  playbookActions: PlaybookAction[];
  criticalItems: CriticalItem[];
}

export const useGeneratedAIInsights = () => {
  const [insights, setInsights] = useState<GeneratedInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = useCallback(async (
    handoverId: string,
    tasks: HandoverTask[],
    exitingEmployeeName?: string,
    department?: string
  ) => {
    // Prevent duplicate requests
    if (loading) {
      console.log('Already generating insights, skipping...');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Calling generate-ai-insights edge function...');
      
      const { data, error: fnError } = await supabase.functions.invoke('generate-ai-insights', {
        body: {
          handoverId,
          tasks,
          exitingEmployeeName,
          department
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate insights');
      }

      if (data?.error) {
        // Handle rate limit error specifically
        if (data.error.includes('429')) {
          throw new Error('Rate limit exceeded (429). Please wait a minute before trying again.');
        }
        throw new Error(data.error);
      }

      if (data?.insights) {
        setInsights(data.insights);
        return data.insights;
      }

      throw new Error('No insights returned from AI');
    } catch (err: any) {
      console.error('Error generating AI insights:', err);
      const errorMessage = err.message || 'Failed to generate AI insights';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clearInsights = useCallback(() => {
    setInsights(null);
    setError(null);
  }, []);

  return {
    insights,
    loading,
    error,
    generateInsights,
    clearInsights
  };
};
