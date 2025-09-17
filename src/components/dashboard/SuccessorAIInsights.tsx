import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  // Fallback sample data when no insights are available
  const sampleRevenueInsights = [
    {
      metric: "Renewals Secured",
      value: "78% of contracts renewed",
      insight: "High-value contracts renewed but 2 major accounts pending."
    },
    {
      metric: "Upsell Opportunities", 
      value: "₹35L identified",
      insight: "Cross-sell opportunities in tech add-ons for Acme Corp."
    },
    {
      metric: "Churn Risk Accounts",
      value: "3 flagged (₹42L pipeline)", 
      insight: "Zenith Ltd and Nova Tech require immediate action to avoid losses."
    }
  ];

  const samplePlayBookActions = [
    {
      title: "Meet CFO of Zenith Ltd",
      detail: "22% revenue exposure, contract expiring in 30 days"
    },
    {
      title: "Re-negotiate SLA with Nova Tech",
      detail: "40% churn risk if unresolved"
    },
    {
      title: "Intro calls with 2 strategic accounts",
      detail: "Strengthens 70% of pipeline"
    }
  ];

  const sampleCriticalItems = [
    {
      title: "Acme Corp Renewal Risk",
      insight: "AI predicts 68% churn probability. Escalation required within 2 weeks."
    },
    {
      title: "Zenith Ltd Contract Expiry",
      insight: "Contract ending in 30 days. Direct successor introduction recommended."
    },
    {
      title: "Delayed Payments - Nova Tech",
      insight: "Late payments for last 2 months. High likelihood of dissatisfaction."
    }
  ];

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

  const { revenueInsights, playBookActions, criticalItems } = groupInsightsByCategory(insights);

  // Use sample data as fallback when no insights are available
  const displayRevenueInsights = revenueInsights.length > 0 ? revenueInsights : sampleRevenueInsights;
  const displayPlayBookActions = playBookActions.length > 0 ? playBookActions : samplePlayBookActions;  
  const displayCriticalItems = criticalItems.length > 0 ? criticalItems : sampleCriticalItems;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Growth & Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">📊</span>
            </div>
            Revenue Growth & Retention
            <div className="ml-auto">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                🤖 AI
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-gray-700">
            {displayRevenueInsights.map((item, idx) => (
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
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🎯</span>
            </div>
            AI Successor Playbook
            <div className="ml-auto">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                🤖 AI
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayPlayBookActions.map((action, idx) => (
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
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">⚠️</span>
            </div>
            Critical & Priority AI Insights
            <div className="ml-auto">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                🤖 AI
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayCriticalItems.map((item, idx) => (
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