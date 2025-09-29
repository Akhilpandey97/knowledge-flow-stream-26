import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIInsight {
  type: 'prediction' | 'recommendation' | 'trend' | 'alert';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low' | 'positive';
  createdAt: string;
}

export const useAIInsightsForHR = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch AI insights from the database
      const { data: insightsData, error: insightsError } = await supabase
        .from('ai_knowledge_insights_complex')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (insightsError) throw insightsError;

      const processedInsights: AIInsight[] = [];

      // Process database insights
      if (insightsData && insightsData.length > 0) {
        insightsData.forEach(insight => {
          try {
            // Try to parse insights field if it's JSON
            let parsedInsights = [];
            if (insight.insights) {
              try {
                parsedInsights = JSON.parse(insight.insights);
              } catch {
                // If not JSON, treat as single insight
                parsedInsights = [{ 
                  title: 'AI Insight', 
                  description: insight.insights,
                  type: 'recommendation'
                }];
              }
            }

            // Process individual insight or the main insight field
            if (Array.isArray(parsedInsights)) {
              parsedInsights.forEach((item: any) => {
                processedInsights.push({
                  type: item.type || 'recommendation',
                  title: item.title || 'AI Analysis',
                  description: item.description || item.insight || insight.insight || 'No details available',
                  priority: item.priority || 'medium',
                  createdAt: insight.created_at
                });
              });
            } else {
              // Single insight
              processedInsights.push({
                type: 'recommendation',
                title: 'AI Knowledge Insight',
                description: insight.insight || 'No details available',
                priority: 'medium',
                createdAt: insight.created_at
              });
            }
          } catch (err) {
            console.error('Error processing insight:', err);
          }
        });
      }

      // Add synthetic insights based on handover data
      const { data: handovers } = await supabase
        .from('handovers')
        .select(`
          *,
          employee:users!handovers_employee_id_fkey(department),
          tasks(status)
        `);

      if (handovers && handovers.length > 0) {
        // Generate insights based on handover statistics
        const totalHandovers = handovers.length;
        const unassignedSuccessors = handovers.filter(h => !h.successor_id).length;
        const lowProgressHandovers = handovers.filter(h => (h.progress || 0) < 30).length;
        
        // Department analysis
        const deptStats: { [key: string]: { total: number; progress: number } } = {};
        handovers.forEach(h => {
          const dept = h.employee?.department || 'Unknown';
          if (!deptStats[dept]) deptStats[dept] = { total: 0, progress: 0 };
          deptStats[dept].total++;
          deptStats[dept].progress += h.progress || 0;
        });

        // Generate critical alerts
        if (unassignedSuccessors > 0) {
          processedInsights.unshift({
            type: 'alert',
            title: 'Unassigned Successors Alert',
            description: `${unassignedSuccessors} handover${unassignedSuccessors > 1 ? 's' : ''} without assigned successors - immediate action required`,
            priority: 'critical',
            createdAt: new Date().toISOString()
          });
        }

        if (lowProgressHandovers > 0) {
          processedInsights.unshift({
            type: 'prediction',
            title: 'Knowledge Loss Risk Forecast',
            description: `${Math.round((lowProgressHandovers / totalHandovers) * 100)}% of transitions at risk due to slow progress`,
            priority: 'high',
            createdAt: new Date().toISOString()
          });
        }

        // Best performing department
        const bestDept = Object.entries(deptStats)
          .map(([dept, stats]) => ({ dept, avgProgress: stats.progress / stats.total }))
          .sort((a, b) => b.avgProgress - a.avgProgress)[0];

        if (bestDept && bestDept.avgProgress > 60) {
          processedInsights.push({
            type: 'trend',
            title: 'Department Performance Excellence',
            description: `${bestDept.dept} department showing ${Math.round(bestDept.avgProgress)}% average progress in knowledge transfers`,
            priority: 'positive',
            createdAt: new Date().toISOString()
          });
        }
      }

      // Limit to top 6 insights
      setInsights(processedInsights.slice(0, 6));

    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
      
      // Provide fallback insights
      setInsights([
        {
          type: 'recommendation',
          title: 'System Ready',
          description: 'AI monitoring system is active and analyzing handover patterns',
          priority: 'positive',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    
    // Set up real-time subscription for new insights
    const channel = supabase
      .channel('ai-insights-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_knowledge_insights_complex'
      }, () => {
        fetchInsights();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { insights, loading, error, refetch: fetchInsights };
};