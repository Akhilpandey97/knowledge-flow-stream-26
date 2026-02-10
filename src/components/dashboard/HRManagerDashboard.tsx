import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, Users, AlertTriangle, TrendingUp, Brain, Sparkles, Target, 
  UserCheck, UserX, TrendingDown, CheckCircle2, Loader2, HelpCircle,
  Search, ChevronDown, ChevronUp, Zap, ArrowRight, Clock, Mail
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ManageHandovers } from './ManageHandovers';
import { HelpRequestsPanel } from './HelpRequestsPanel';
import { useHandoverStats } from '@/hooks/useHandoverStats';
import { useHandoversList } from '@/hooks/useHandoversList';
import { useAIInsightsForHR } from '@/hooks/useAIInsightsForHR';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useAuth } from '@/contexts/AuthContext';

// --- Sub-components ---

const StatPill: React.FC<{ icon: React.ReactNode; value: string | number; label: string; variant?: string }> = ({ icon, value, label, variant }) => (
  <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border bg-card ${
    variant === 'critical' ? 'border-critical/30 bg-critical/5' : 
    variant === 'success' ? 'border-success/30 bg-success/5' : 
    'border-border'
  }`}>
    {icon}
    <div className="flex items-baseline gap-1.5">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  </div>
);

const InsightChip: React.FC<{ type: string; title: string; description: string; priority: string }> = ({ type, title, description, priority }) => {
  const iconMap: Record<string, React.ReactNode> = {
    prediction: <TrendingDown className="h-3.5 w-3.5" />,
    recommendation: <Target className="h-3.5 w-3.5" />,
    trend: <TrendingUp className="h-3.5 w-3.5" />,
    alert: <AlertTriangle className="h-3.5 w-3.5" />,
  };
  const colorMap: Record<string, string> = {
    critical: 'border-critical/30 bg-critical/5 text-critical',
    high: 'border-warning/30 bg-warning/5 text-warning',
    positive: 'border-success/30 bg-success/5 text-success',
    medium: 'border-primary/30 bg-primary/5 text-primary',
    low: 'border-muted-foreground/20 bg-muted text-muted-foreground',
  };
  return (
    <div className={`flex-shrink-0 w-64 rounded-lg border p-3 space-y-1 ${colorMap[priority] || colorMap.medium}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide opacity-80">
        {iconMap[type] || <Sparkles className="h-3.5 w-3.5" />}
        {type}
      </div>
      <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </div>
  );
};

const HandoverRow: React.FC<{ handover: any; expanded: boolean; onToggle: () => void }> = ({ handover, expanded, onToggle }) => {
  const riskColors: Record<string, string> = {
    critical: 'bg-critical/10 text-critical border-critical/20',
    high: 'bg-warning/10 text-warning border-warning/20',
    medium: 'bg-primary/10 text-primary border-primary/20',
    low: 'bg-success/10 text-success border-success/20',
  };
  const progressVariant = handover.progress >= 80 ? 'success' : handover.progress >= 50 ? 'warning' : 'critical';
  
  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-4 p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{handover.exitingEmployee}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{handover.successor}</span>
          </div>
          <span className="text-xs text-muted-foreground">{handover.department}</span>
        </div>
        <div className="w-32 hidden sm:block">
          <Progress value={handover.progress} variant={progressVariant} className="h-1.5" />
          <span className="text-xs text-muted-foreground">{handover.progress}%</span>
        </div>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${riskColors[handover.aiRiskLevel]}`}>
          {handover.aiRiskLevel}
        </Badge>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="text-xs truncate">{handover.exitingEmployeeEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="text-xs truncate">{handover.successorEmail || 'Not assigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Created {new Date(handover.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Progress value={handover.progress} variant={progressVariant} className="h-1.5 flex-1" />
            <span className="text-xs font-medium">{handover.progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {handover.completedTasks}/{handover.taskCount} tasks · <span className="italic">{handover.aiRecommendation}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export const HRManagerDashboard: React.FC = () => {
  const [showManageHandovers, setShowManageHandovers] = useState(false);
  const [expandedHandover, setExpandedHandover] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  const { stats, loading: statsLoading, error: statsError } = useHandoverStats(user?.department);
  const { handovers, loading: handoversLoading, error: handoversError } = useHandoversList(user?.department);
  const { insights, loading: insightsLoading, error: insightsError } = useAIInsightsForHR();
  const { requests: managerRequests, loading: requestsLoading, respondToRequest } = useHelpRequests('manager');

  const isLoading = statsLoading || handoversLoading || insightsLoading;
  const managerEscalations = managerRequests.filter(r => r.request_type === 'manager');
  const pendingEscalations = managerEscalations.filter(r => r.status === 'pending').length;

  // Derived data for overview
  const needsAttention = useMemo(() => {
    const noSuccessor = handovers.filter(h => !h.successorEmail);
    const lowProgress = handovers.filter(h => h.progress < 30 && h.successorEmail);
    return { noSuccessor, lowProgress };
  }, [handovers]);

  // Filtered handovers for the Handovers tab
  const filteredHandovers = useMemo(() => {
    let list = handovers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => 
        h.exitingEmployee.toLowerCase().includes(q) || 
        h.successor.toLowerCase().includes(q) || 
        h.exitingEmployeeEmail.toLowerCase().includes(q) ||
        (h.successorEmail || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter(h => h.status === statusFilter);
    }
    return list;
  }, [handovers, searchQuery, statusFilter]);

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

  if (showManageHandovers) {
    return <ManageHandovers onBack={() => setShowManageHandovers(false)} />;
  }

  const hasErrors = statsError || handoversError || insightsError;
  const attentionCount = needsAttention.noSuccessor.length + needsAttention.lowProgress.length + pendingEscalations;

  return (
    <div className="space-y-5">
      {/* Compact Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Manager's Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                {user?.department ? `${user.department} Department` : 'Employee transition management'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExportButton title="Export Report" />
            <Button onClick={() => setShowManageHandovers(true)} size="sm">
              <Users className="w-4 h-4 mr-1.5" />
              Create Handovers
            </Button>
          </div>
        </div>

        {/* Stat Pills */}
        <div className="flex flex-wrap gap-2">
          <StatPill icon={<BarChart3 className="h-4 w-4 text-primary" />} value={`${stats.overallProgress}%`} label="Progress" />
          <StatPill icon={<UserX className="h-4 w-4 text-warning" />} value={stats.exitingEmployees} label="Exiting" />
          <StatPill icon={<UserCheck className="h-4 w-4 text-primary" />} value={stats.successorsAssigned} label="Successors" />
          <StatPill icon={<CheckCircle2 className="h-4 w-4 text-success" />} value={stats.completedHandovers} label="Completed" variant="success" />
          <StatPill icon={<AlertTriangle className="h-4 w-4 text-critical" />} value={stats.highRiskCount} label="At Risk" variant={stats.highRiskCount > 0 ? 'critical' : undefined} />
        </div>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <div className="rounded-lg border border-critical/20 bg-critical/5 px-4 py-3 text-sm text-critical flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Failed to load some data. Please refresh.
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="handovers">
            Handovers
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{handovers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="escalations">
            Escalations
            {pendingEscalations > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 px-1.5 text-[10px]">{pendingEscalations}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-5">
          {/* Needs Attention */}
          {attentionCount > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                  <Zap className="h-4 w-4" />
                  {attentionCount} item{attentionCount > 1 ? 's' : ''} need attention
                </div>
                <div className="space-y-2">
                  {needsAttention.noSuccessor.map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-sm bg-card rounded-md px-3 py-2 border">
                      <UserX className="h-3.5 w-3.5 text-critical flex-shrink-0" />
                      <span className="font-medium">{h.exitingEmployee}</span>
                      <span className="text-muted-foreground">— no successor assigned</span>
                    </div>
                  ))}
                  {needsAttention.lowProgress.map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-sm bg-card rounded-md px-3 py-2 border">
                      <TrendingDown className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                      <span className="font-medium">{h.exitingEmployee} → {h.successor}</span>
                      <span className="text-muted-foreground">— only {h.progress}% complete</span>
                    </div>
                  ))}
                  {pendingEscalations > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-card rounded-md px-3 py-2 border">
                      <HelpCircle className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                      <span className="font-medium">{pendingEscalations} pending escalation{pendingEscalations > 1 ? 's' : ''}</span>
                      <span className="text-muted-foreground">from successors</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights - horizontal scroll */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Brain className="h-4 w-4 text-primary" />
              AI Insights
            </div>
            {insights.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {insights.map((insight, i) => (
                  <InsightChip key={i} type={insight.type} title={insight.title} description={insight.description} priority={insight.priority} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No AI insights available yet.</p>
            )}
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.inProgressHandovers}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{handovers.filter(h => h.status === 'review').length}</div>
                <div className="text-xs text-muted-foreground">In Review</div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-success">{stats.completedHandovers}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Handovers Tab */}
        <TabsContent value="handovers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredHandovers.length > 0 ? (
              filteredHandovers.map(h => (
                <HandoverRow 
                  key={h.id} 
                  handover={h} 
                  expanded={expandedHandover === h.id}
                  onToggle={() => setExpandedHandover(expandedHandover === h.id ? null : h.id)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{searchQuery || statusFilter !== 'all' ? 'No handovers match your filters.' : 'No handovers yet. Create your first one.'}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Escalations Tab */}
        <TabsContent value="escalations">
          <HelpRequestsPanel
            requests={managerEscalations}
            loading={requestsLoading}
            onRespond={respondToRequest}
            title="Escalations from Successors"
            description="Successors need your help with these tasks"
            emptyMessage="No escalations at this time."
            viewerRole="manager"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
