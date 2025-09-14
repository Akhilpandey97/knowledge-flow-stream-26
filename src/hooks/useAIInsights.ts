import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'critical' | 'warning' | 'success' | 'info';
  icon: string;
  created_at: string;
}

export const useAIInsights = (handoverId?: string) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!user) {
        setInsights([]);
        setLoading(false);
        return;
      }

      try {
        // For successors, we need to find insights from handovers where they are the successor
        // For other users, we can fetch by user_id or handover_id
        let query;
        
        if (handoverId) {
          // If we have a specific handover ID, fetch insights for that handover
          query = supabase
            .from('ai_knowledge_insights_complex')
            .select('*')
            .eq('handover_id', handoverId);
        } else {
          // Fetch insights for current user OR handovers where user is successor
          const handoversQuery = await supabase
            .from('handovers')
            .select('id')
            .eq('successor_id', user.id);
          
          if (handoversQuery.data && handoversQuery.data.length > 0) {
            const handoverIds = handoversQuery.data.map(h => h.id);
            query = supabase
              .from('ai_knowledge_insights_complex')
              .select('*')
              .or(`user_id.eq.${user.id},handover_id.in.(${handoverIds.join(',')})`);
          } else {
            // Fallback to just user_id
            query = supabase
              .from('ai_knowledge_insights_complex')
              .select('*')
              .eq('user_id', user.id);
          }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform the insights data to match our UI structure
        const transformedInsights: AIInsight[] = [];
        
        if (data && data.length > 0) {
          data.forEach((record) => {
            const insights = record.insights;
            
            // Handle different insight formats from Lindy
            if (Array.isArray(insights)) {
              // If insights is an array of insight objects
              insights.forEach((insight: any, index: number) => {
                transformedInsights.push({
                  id: `${record.id}-${index}`,
                  title: String(insight.title || insight.summary || 'AI Insight'),
                  description: String(insight.description || insight.content || insight.message || JSON.stringify(insight)),
                  type: String(insight.priority) === 'high' ? 'critical' : 
                        String(insight.priority) === 'medium' ? 'warning' : 
                        String(insight.type) === 'success' ? 'success' : 'info',
                  icon: String(insight.icon || getIconForType(String(insight.type || insight.priority))),
                  created_at: record.created_at
                });
              });
            } else if (typeof insights === 'object' && insights !== null) {
              // If insights is a single object
              if (insights.recommendations && Array.isArray(insights.recommendations)) {
                // Handle format with recommendations array
                insights.recommendations.forEach((rec: any, index: number) => {
                  transformedInsights.push({
                    id: `${record.id}-rec-${index}`,
                    title: String(rec.title || rec.category || 'Recommendation'),
                    description: String(rec.description || rec.content || rec.text || JSON.stringify(rec)),
                    type: String(rec.priority) === 'critical' ? 'critical' : 
                          String(rec.priority) === 'high' ? 'warning' : 
                          String(rec.type) === 'success' ? 'success' : 'info',
                    icon: String(rec.icon || getIconForType(String(rec.priority || rec.type))),
                    created_at: record.created_at
                  });
                });
              } else {
                // Handle single insight object
                transformedInsights.push({
                  id: record.id,
                  title: String(insights.title || insights.summary || 'AI Knowledge Insight'),
                  description: String(insights.description || insights.content || insights.message || JSON.stringify(insights)),
                  type: String(insights.priority) === 'high' ? 'critical' : 
                        String(insights.priority) === 'medium' ? 'warning' : 
                        String(insights.type) === 'success' ? 'success' : 'info',
                  icon: String(insights.icon || getIconForType(String(insights.type || insights.priority))),
                  created_at: record.created_at
                });
              }
            } else if (typeof insights === 'string') {
              // Handle string insights
              transformedInsights.push({
                id: record.id,
                title: 'AI Knowledge Insight',
                description: insights,
                type: 'info',
                icon: '🤖',
                created_at: record.created_at
              });
            }
          });
        }

        setInsights(transformedInsights);
      } catch (err: any) {
        setError(err.message);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAIInsights();
  }, [user, handoverId]);

  return {
    insights,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
      // Re-trigger the effect by updating a dependency
    }
  };
};

// Helper function to get icon based on type/priority
const getIconForType = (type?: string): string => {
  switch (type) {
    case 'critical':
    case 'high':
      return '🎯';
    case 'warning':
    case 'medium':
      return '🧩';
    case 'success':
    case 'low':
      return '📈';
    default:
      return '💡';
  }
};