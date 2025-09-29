import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Eye,
  MessageSquare,
  Brain,
  Sparkles,
  Target,
  UserCheck,
  UserX,
  Zap,
  TrendingDown,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ManageHandovers } from './ManageHandovers';
import { useHandoverStats } from '@/hooks/useHandoverStats';
import { useHandoversList } from '@/hooks/useHandoversList';
import { useAIInsightsForHR } from '@/hooks/useAIInsightsForHR';


export const HRManagerDashboard: React.FC = () => {
  const [showManageHandovers, setShowManageHandovers] = useState(false);
  
  // Fetch real data using custom hooks
  const { stats, loading: statsLoading, error: statsError } = useHandoverStats();
  const { handovers, loading: handoversLoading, error: handoversError } = useHandoversList();
  const { insights, loading: insightsLoading, error: insightsError } = useAIInsightsForHR();
  
  const isLoading = statsLoading || handoversLoading || insightsLoading;

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
              <h2 className="text-3xl font-bold text-foreground">Manager Dashboard</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-powered employee transition management
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

      {/* Employee Management Tabs */}
      <Tabs defaultValue="transitions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transitions">Active Transitions</TabsTrigger>
          <TabsTrigger value="exiting">Exiting Employees</TabsTrigger>
          <TabsTrigger value="successors">Successors</TabsTrigger>
        </TabsList>

        <TabsContent value="transitions">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Active Knowledge Transitions
                <Badge variant="secondary" className="ml-auto">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Monitored
                </Badge>
              </CardTitle>
              <CardDescription>AI-powered transition monitoring and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {handovers.map((handover) => (
                  <div key={handover.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{handover.exitingEmployee} → {handover.successor}</h4>
                        <p className="text-sm text-muted-foreground">
                          {handover.department} Department
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex gap-2">
                          <Badge variant={getStatusColor(handover.status) as any} className="text-xs">
                            {handover.status.replace('-', ' ')}
                          </Badge>
                          <Badge className={`text-xs ${getRiskColor(handover.aiRiskLevel)}`}>
                            <Brain className="h-2 w-2 mr-1" />
                            {handover.aiRiskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {new Date(handover.dueDate).toLocaleDateString()}
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
                        className="h-1.5"
                      />
                    </div>

                    {/* AI Recommendation */}
                    <div className="bg-primary-soft/30 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-primary">AI Recommendation</p>
                          <p className="text-xs text-muted-foreground">{handover.aiRecommendation}</p>
                        </div>
                      </div>
                    </div>

                    {handover.criticalGaps > 0 && (
                      <Alert className="border-critical/20 bg-critical-soft py-2">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          {handover.criticalGaps} critical gap{handover.criticalGaps > 1 ? 's' : ''} identified by AI analysis
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Contact Team
                      </Button>
                      <Button variant="outline" size="sm">
                        <Brain className="w-3 h-3 mr-1" />
                        AI Analysis
                      </Button>
                    </div>
                  </div>
                ))}
                {handovers.length === 0 && !handoversLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active handovers found. Create your first handover to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exiting">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-orange-600" />
                Exiting Employees
              </CardTitle>
              <CardDescription>Manage departing team members and knowledge capture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {handovers.map((handover) => (
                  <div key={handover.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{handover.exitingEmployee}</h4>
                        <p className="text-sm text-muted-foreground">{handover.department} Department</p>
                        <p className="text-xs text-muted-foreground">{handover.exitingEmployeeEmail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Target: {new Date(handover.dueDate).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{handover.progress}% knowledge transferred</p>
                        <p className="text-xs text-muted-foreground">{handover.completedTasks}/{handover.taskCount} tasks done</p>
                      </div>
                    </div>
                  </div>
                ))}
                {handovers.length === 0 && !handoversLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No exiting employees found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="successors">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Successor Management
              </CardTitle>
              <CardDescription>Track successor assignments and readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {handovers.filter(h => h.successor !== 'Not Assigned').map((handover) => (
                  <div key={handover.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{handover.successor}</h4>
                        <p className="text-sm text-muted-foreground">Taking over from {handover.exitingEmployee}</p>
                        <p className="text-xs text-muted-foreground">{handover.department} Department</p>
                        {handover.successorEmail && (
                          <p className="text-xs text-muted-foreground">{handover.successorEmail}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {handover.progress}% Ready
                          </Badge>
                          <Badge className={`text-xs ${getRiskColor(handover.aiRiskLevel)}`}>
                            {handover.aiRiskLevel} risk
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Target {new Date(handover.dueDate).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{handover.completedTasks}/{handover.taskCount} tasks</p>
                      </div>
                    </div>
                  </div>
                ))}
                {handovers.filter(h => h.successor !== 'Not Assigned').length === 0 && !handoversLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No successors assigned yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};