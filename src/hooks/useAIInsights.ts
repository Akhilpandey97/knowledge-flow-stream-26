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

export const useAIInsights = () => {
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
        const { data, error } = await supabase
          .from('ai_knowledge_insights')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

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
                  title: insight.title || insight.summary || 'AI Insight',
                  description: insight.description || insight.content || insight.message || JSON.stringify(insight),
                  type: insight.priority === 'high' ? 'critical' : 
                        insight.priority === 'medium' ? 'warning' : 
                        insight.type === 'success' ? 'success' : 'info',
                  icon: insight.icon || getIconForType(insight.type || insight.priority),
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
                    title: rec.title || rec.category || 'Recommendation',
                    description: rec.description || rec.content || rec.text || JSON.stringify(rec),
                    type: rec.priority === 'critical' ? 'critical' : 
                          rec.priority === 'high' ? 'warning' : 
                          rec.type === 'success' ? 'success' : 'info',
                    icon: rec.icon || getIconForType(rec.priority || rec.type),
                    created_at: record.created_at
                  });
                });
              } else {
                // Handle single insight object
                transformedInsights.push({
                  id: record.id,
                  title: insights.title || insights.summary || 'AI Knowledge Insight',
                  description: insights.description || insights.content || insights.message || JSON.stringify(insights),
                  type: insights.priority === 'high' ? 'critical' : 
                        insights.priority === 'medium' ? 'warning' : 
                        insights.type === 'success' ? 'success' : 'info',
                  icon: insights.icon || getIconForType(insights.type || insights.priority),
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
  }, [user]);

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