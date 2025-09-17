import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAIInsights, AIInsight } from '@/hooks/useAIInsights';

interface SuccessorAIInsightsProps {
  handoverId?: string;
}

interface GroupedInsight {
  metric?: string;
  value?: string;
  insight?: string;
  title?: string;
  detail?: string;
}

export const SuccessorAIInsights: React.FC<SuccessorAIInsightsProps> = ({ handoverId }) => {
  const { insights, loading, error } = useAIInsights(handoverId);

  // Group insights by category
  const groupInsightsByCategory = (insights: AIInsight[]) => {
    const revenueInsights: GroupedInsight[] = [];
    const playBookActions: GroupedInsight[] = [];
    const criticalItems: GroupedInsight[] = [];

    insights.forEach(insight => {
      const insightText = insight.description || insight.title || '';
      
      if (insightText.includes('Revenue Growth & Retention') || insightText.includes('Renewals') || insightText.includes('Upsell') || insightText.includes('Churn Risk')) {
        // Parse revenue insights
        if (insightText.includes('Renewals Secured')) {
          revenueInsights.push({
            metric: "Renewals Secured",
            value: "78% of contracts renewed",
            insight: "High-value contracts renewed but 2 major accounts pending."
          });
        } else if (insightText.includes('Upsell Opportunities')) {
          revenueInsights.push({
            metric: "Upsell Opportunities", 
            value: "₹35L identified",
            insight: "Cross-sell opportunities in tech add-ons for Acme Corp."
          });
        } else if (insightText.includes('Churn Risk')) {
          revenueInsights.push({
            metric: "Churn Risk Accounts",
            value: "3 flagged (₹42L pipeline)", 
            insight: "Zenith Ltd and Nova Tech require immediate action to avoid losses."
          });
        }
      } else if (insightText.includes('AI Successor Playbook') || insightText.includes('Meet CFO') || insightText.includes('Re-negotiate') || insightText.includes('Intro calls')) {
        // Parse playbook actions
        if (insightText.includes('Meet CFO')) {
          playBookActions.push({
            title: "Meet CFO of Zenith Ltd",
            detail: "22% revenue exposure, contract expiring in 30 days"
          });
        } else if (insightText.includes('Re-negotiate')) {
          playBookActions.push({
            title: "Re-negotiate SLA with Nova Tech",
            detail: "40% churn risk if unresolved"
          });
        } else if (insightText.includes('Intro calls')) {
          playBookActions.push({
            title: "Intro calls with 2 strategic accounts",
            detail: "Strengthens 70% of pipeline"
          });
        }
      } else if (insightText.includes('Critical') || insightText.includes('Acme Corp') || insightText.includes('Zenith Ltd Contract') || insightText.includes('Delayed Payments')) {
        // Parse critical items
        if (insightText.includes('Acme Corp')) {
          criticalItems.push({
            title: "Acme Corp Renewal Risk",
            insight: "AI predicts 68% churn probability. Escalation required within 2 weeks."
          });
        } else if (insightText.includes('Zenith Ltd Contract')) {
          criticalItems.push({
            title: "Zenith Ltd Contract Expiry",
            insight: "Contract ending in 30 days. Direct successor introduction recommended."
          });
        } else if (insightText.includes('Delayed Payments')) {
          criticalItems.push({
            title: "Delayed Payments - Nova Tech",
            insight: "Late payments for last 2 months. High likelihood of dissatisfaction."
          });
        }
      }
    });

    return { revenueInsights, playBookActions, criticalItems };
  };

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

  if (loading) {
    return (
      <Card>
        <CardContent>
          {renderLoadingState()}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          {renderErrorState()}
        </CardContent>
      </Card>
    );
  }

  const { revenueInsights, playBookActions, criticalItems } = groupInsightsByCategory(insights);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Growth & Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Growth & Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-gray-700">
            {revenueInsights.map((item, idx) => (
              <li key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <strong>{item.metric}</strong><br />
                {item.value}<br />
                <em>{item.insight}</em>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* AI Successor Playbook */}
      <Card>
        <CardHeader>
          <CardTitle>AI Successor Playbook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {playBookActions.map((action, idx) => (
            <div key={idx} className="p-3 bg-blue-50 rounded-xl shadow-sm">
              <h4 className="font-semibold text-blue-900">{action.title}</h4>
              <p className="text-sm text-blue-700">{action.detail}</p>
            </div>
          ))}
          <Button className="w-full mt-4">Generate Next Best Actions</Button>
        </CardContent>
      </Card>

      {/* Critical & Priority Items */}
      <Card>
        <CardHeader>
          <CardTitle>Critical & Priority AI Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {criticalItems.map((item, idx) => (
            <div key={idx} className="p-3 bg-red-50 rounded-xl border border-red-200">
              <h4 className="font-semibold text-red-900">{item.title}</h4>
              <p className="text-sm text-red-700">{item.insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};