import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useGeneratedAIInsights, RevenueInsight, PlaybookAction, CriticalItem } from '@/hooks/useGeneratedAIInsights';
import { HandoverTask } from '@/types/handover';

interface SuccessorAIInsightsProps {
  handoverId?: string;
  tasks?: HandoverTask[];
  exitingEmployeeName?: string;
  department?: string;
}

export const SuccessorAIInsights: React.FC<SuccessorAIInsightsProps> = ({ 
  handoverId, 
  tasks = [],
  exitingEmployeeName,
  department
}) => {
  const { insights, loading, error, generateInsights } = useGeneratedAIInsights();

  // Fallback sample data when no insights are available
  const sampleRevenueInsights: RevenueInsight[] = [
    {
      metric: "Renewals Secured",
      value: "78% of contracts renewed",
      insight: "High-value contracts renewed but 2 major accounts pending."
    },
    {
      metric: "Upsell Opportunities", 
      value: "₹35L identified",
      insight: "Cross-sell opportunities in tech add-ons for key accounts."
    },
    {
      metric: "Churn Risk Accounts",
      value: "3 flagged (₹42L pipeline)", 
      insight: "Priority accounts require immediate attention to avoid losses."
    }
  ];

  const samplePlayBookActions: PlaybookAction[] = [
    {
      title: "Meet Key Stakeholders",
      detail: "22% revenue exposure, contracts expiring in 30 days"
    },
    {
      title: "Re-negotiate Critical SLAs",
      detail: "40% churn risk if unresolved"
    },
    {
      title: "Intro calls with strategic accounts",
      detail: "Strengthens 70% of pipeline"
    }
  ];

  const sampleCriticalItems: CriticalItem[] = [
    {
      title: "Account Renewal Risk",
      insight: "AI predicts 68% churn probability. Escalation required within 2 weeks."
    },
    {
      title: "Contract Expiry Alert",
      insight: "Contract ending in 30 days. Direct successor introduction recommended."
    },
    {
      title: "Payment Delays Detected",
      insight: "Late payments for last 2 months. High likelihood of dissatisfaction."
    }
  ];

  // Auto-generate insights when tasks are available
  useEffect(() => {
    if (tasks.length > 0 && !insights && !loading && handoverId) {
      generateInsights(handoverId, tasks, exitingEmployeeName, department);
    }
  }, [tasks, insights, loading, handoverId, exitingEmployeeName, department, generateInsights]);

  const handleGenerateInsights = () => {
    if (handoverId && tasks.length > 0) {
      generateInsights(handoverId, tasks, exitingEmployeeName, department);
    }
  };

  // Use AI-generated insights or fallback to sample data
  const displayRevenueInsights = insights?.revenueInsights?.length ? insights.revenueInsights : sampleRevenueInsights;
  const displayPlayBookActions = insights?.playbookActions?.length ? insights.playbookActions : samplePlayBookActions;
  const displayCriticalItems = insights?.criticalItems?.length ? insights.criticalItems : sampleCriticalItems;

  const isUsingRealData = !!insights;

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      {tasks.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {isUsingRealData ? 'AI Insights Generated from Handover Data' : 'Sample AI Insights (Generate for real analysis)'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateInsights}
            disabled={loading || !handoverId}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {isUsingRealData ? 'Regenerate' : 'Generate'} AI Insights
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Growth & Retention */}
        <Card className={isUsingRealData ? 'border-primary/30' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
              Revenue Growth & Retention
              <div className="ml-auto">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  isUsingRealData ? 'bg-primary text-primary-foreground' : 'bg-blue-100 text-blue-800'
                }`}>
                  🤖 AI {isUsingRealData && '✓'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ul className="space-y-3 text-sm text-foreground">
                {displayRevenueInsights.map((item, idx) => (
                  <li key={idx} className="p-3 bg-muted rounded-lg border border-border">
                    <strong>{item.metric}</strong><br />
                    <span className="text-primary font-medium">{item.value}</span><br />
                    <em className="text-muted-foreground">{item.insight}</em>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* AI Successor Playbook */}
        <Card className={isUsingRealData ? 'border-primary/30' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
              AI Successor Playbook
              <div className="ml-auto">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  isUsingRealData ? 'bg-primary text-primary-foreground' : 'bg-blue-100 text-blue-800'
                }`}>
                  🤖 AI {isUsingRealData && '✓'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {displayPlayBookActions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-primary/5 rounded-xl shadow-sm border border-primary/10">
                    <h4 className="font-semibold text-foreground">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.detail}</p>
                  </div>
                ))}
                <Button 
                  className="w-full mt-4" 
                  onClick={handleGenerateInsights}
                  disabled={loading || !handoverId || tasks.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Next Best Actions'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Critical & Priority Items */}
        <Card className={isUsingRealData ? 'border-primary/30' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">⚠️</span>
              </div>
              Critical & Priority AI Insights
              <div className="ml-auto">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  isUsingRealData ? 'bg-primary text-primary-foreground' : 'bg-blue-100 text-blue-800'
                }`}>
                  🤖 AI {isUsingRealData && '✓'}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              displayCriticalItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-destructive/5 rounded-xl border border-destructive/20">
                  <h4 className="font-semibold text-destructive">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.insight}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
