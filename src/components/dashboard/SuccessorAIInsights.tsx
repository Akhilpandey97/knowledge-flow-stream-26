import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAIInsights, AIInsight } from '@/hooks/useAIInsights';
import { format } from 'date-fns';

interface SuccessorAIInsightsProps {
  handoverId?: string;
}

export const SuccessorAIInsights: React.FC<SuccessorAIInsightsProps> = ({ handoverId }) => {
  const { insights, loading, error } = useAIInsights(handoverId);

  const renderInsightCard = (insight: AIInsight) => (
    <div key={insight.id} className="bg-background border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground leading-tight">{insight.title}</h4>
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(insight.created_at), 'MMM d, yyyy • h:mm a')}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${getInsightBgClass(insight.type)} flex-shrink-0`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${getInsightIconBgClass(insight.type)}`}>
            <span className="text-xs text-white">{insight.icon}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">🤖</span>
      </div>
      <h4 className="font-medium text-foreground mb-2">No AI insights yet</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Upload documents to get personalized knowledge transfer insights from AI analysis.
      </p>
      <Button variant="outline" size="sm">
        Upload Documents
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span className="text-muted-foreground">Loading AI insights...</span>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center py-8">
      <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
      <p className="text-muted-foreground">Failed to load AI insights</p>
      <p className="text-sm text-muted-foreground">{error}</p>
    </div>
  );

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1 bg-primary-soft rounded">
            <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-xs text-white font-bold">✨</span>
            </div>
          </div>
          AI Knowledge Transfer Insights
        </CardTitle>
        <CardDescription>
          Personalized <span className="text-primary font-medium">recommendations</span> to accelerate your onboarding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading && renderLoadingState()}
          {error && !loading && renderErrorState()}
          {!loading && !error && insights.length === 0 && renderEmptyState()}
          {!loading && !error && insights.length > 0 && (
            <div className="space-y-4">
              {insights.map(renderInsightCard)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper functions for insight styling (matching the existing styles in SuccessorDashboard)
const getInsightBgClass = (type: string): string => {
  switch (type) {
    case 'critical':
      return 'bg-critical-soft';
    case 'warning':
      return 'bg-warning-soft';
    case 'success':
      return 'bg-success-soft';
    default:
      return 'bg-muted';
  }
};

const getInsightIconBgClass = (type: string): string => {
  switch (type) {
    case 'critical':
      return 'bg-critical';
    case 'warning':
      return 'bg-warning';
    case 'success':
      return 'bg-success';
    default:
      return 'bg-primary';
  }
};