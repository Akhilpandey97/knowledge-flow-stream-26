import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Eye,
  MessageSquare,
  Brain,
  Sparkles,
  Target,
  UserCheck,
  UserX,
  Zap,
  TrendingDown,
  CheckCircle2,
  Loader2,
  HelpCircle
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ManageHandovers } from './ManageHandovers';
import { HelpRequestsPanel } from './HelpRequestsPanel';
import { useHandoverStats } from '@/hooks/useHandoverStats';
import { useHandoversList } from '@/hooks/useHandoversList';
import { useAIInsightsForHR } from '@/hooks/useAIInsightsForHR';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useAuth } from '@/contexts/AuthContext';


export const HRManagerDashboard: React.FC = () => {
  const [showManageHandovers, setShowManageHandovers] = useState(false);
  const { user } = useAuth();
  
  // Fetch real data using custom hooks filtered by manager's department
  const { stats, loading: statsLoading, error: statsError } = useHandoverStats(user?.department);
  const { handovers, loading: handoversLoading, error: handoversError } = useHandoversList(user?.department);
  const { insights, loading: insightsLoading, error: insightsError } = useAIInsightsForHR();
  const { requests: managerRequests, loading: requestsLoading, respondToRequest } = useHelpRequests('manager');
  
  const isLoading = statsLoading || handoversLoading || insightsLoading;
  
  // Filter manager escalations
  const managerEscalations = managerRequests.filter(r => r.request_type === 'manager');
  const pendingEscalations = managerEscalations.filter(r => r.status === 'pending').length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // If showing manage handovers interface, render that instead
  if (showManageHandovers) {
    return <ManageHandovers onBack={() => setShowManageHandovers(false)} />;
  }

  const getProgressVariant = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'review': return 'warning';
      case 'in-progress': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return TrendingDown;
      case 'recommendation': return Target;
      case 'trend': return TrendingUp;
      default: return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary-glow rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Manager's Dashboard</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {user?.department ? `${user.department} Department` : 'AI-powered employee transition management'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportButton title="Export Report" />
          <Button onClick={() => setShowManageHandovers(true)}>
            <Users className="w-4 h-4 mr-2" />
            Create Handovers
          </Button>
        </div>
      </div>

      {/* Manager Escalations Alert */}
      {pendingEscalations > 0 && (
        <Alert className="border-warning/20 bg-warning/5">
          <HelpCircle className="h-4 w-4 text-warning" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>{pendingEscalations}</strong> pending escalation{pendingEscalations > 1 ? 's' : ''} from successors require your attention.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Risk Alerts */}
      {stats.highRiskCount > 0 && (
        <Alert variant="destructive" className="border-critical/20 bg-critical-soft">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>AI Alert:</strong> {stats.highRiskCount} high-risk transition{stats.highRiskCount > 1 ? 's' : ''} detected requiring immediate attention.
              </span>
              <Button variant="destructive" size="sm">
                <Brain className="w-3 h-3 mr-1" />
                AI Analysis
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alerts */}
      {(statsError || handoversError || insightsError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load some dashboard data. Please refresh the page or contact support if the issue persists.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Insights Panel */}
      <Card className="shadow-medium border-primary/20 bg-gradient-to-r from-primary-soft to-primary-soft/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-full">
              <Brain className="h-4 w-4 text-white" />
            </div>
            AI Intelligence Center
          </CardTitle>
          <CardDescription>Real-time insights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.slice(0, 3).map((insight, index) => {
              const IconComponent = getInsightIcon(insight.type);
              return (
                <div key={index} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-soft rounded-lg">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      <Badge 
                        variant={insight.priority === 'critical' ? 'destructive' : insight.priority === 'positive' ? 'default' : 'secondary'}
                        className="mt-2 text-xs"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {insights.length === 0 && !insightsLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No AI insights available yet. Insights will appear as data is analyzed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-soft rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <UserX className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.exitingEmployees}</div>
                <div className="text-sm text-muted-foreground">Exiting Employees</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.successorsAssigned}</div>
                <div className="text-sm text-muted-foreground">Successors Assigned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-soft rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedHandovers}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-critical-soft rounded-lg">
                <AlertTriangle className="h-6 w-6 text-critical" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.highRiskCount}</div>
                <div className="text-sm text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Handovers Section */}
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Active Handovers
              </CardTitle>
              <CardDescription>Monitor and manage ongoing knowledge transfers</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {handovers.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {handovers.map((handover) => (
              <div key={handover.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-base">
                      {handover.exitingEmployee} → {handover.successor}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {handover.department} Department
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{handover.exitingEmployeeEmail}</span>
                      <span>→</span>
                      <span>{handover.successorEmail || 'Not assigned'}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge variant={getStatusColor(handover.status) as any} className="text-xs">
                      {handover.status.replace('-', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(handover.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{handover.progress}%</span>
                  </div>
                  <Progress 
                    value={handover.progress} 
                    variant={getProgressVariant(handover.progress)}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {handover.completedTasks} of {handover.taskCount} tasks completed
                  </p>
                </div>
              </div>
            ))}
            {handovers.length === 0 && !handoversLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base font-medium mb-1">No active handovers found. Create your first handover to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manager Escalations Panel - Always show */}
      <HelpRequestsPanel
        requests={managerEscalations}
        loading={requestsLoading}
        onRespond={respondToRequest}
        title="Escalations from Successors"
        description="Successors need your help with these tasks"
        emptyMessage="No escalations at this time. Escalations from successors will appear here."
        viewerRole="manager"
      />
    </div>
  );
};
