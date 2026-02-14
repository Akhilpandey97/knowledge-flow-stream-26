import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3, Users, AlertTriangle, TrendingUp, Brain, Sparkles, Target, 
  UserCheck, UserX, TrendingDown, CheckCircle2, Loader2, HelpCircle,
  Search, ChevronDown, ChevronUp, Zap, ArrowRight, Clock, Mail, Plus, UserPlus,
  CheckCheck, ShieldCheck
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { HelpRequestsPanel } from './HelpRequestsPanel';
import { useHandoverStats } from '@/hooks/useHandoverStats';
import { useHandoversList } from '@/hooks/useHandoversList';
import { useAIInsightsForHR } from '@/hooks/useAIInsightsForHR';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { useRealHandovers } from '@/hooks/useRealHandovers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const departments = ['Sales', 'Engineering', 'Finance', 'Marketing', 'HR', 'Operations'];

// --- Sub-components ---

const MetricCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; variant?: string }> = ({ icon, value, label, variant }) => (
  <Card className={`enterprise-shadow ${
    variant === 'critical' ? 'border-critical/20' : 
    variant === 'success' ? 'border-success/20' : 
    'border-border/60'
  }`}>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        variant === 'critical' ? 'bg-critical/10 text-critical' :
        variant === 'success' ? 'bg-success/10 text-success' :
        'bg-primary/10 text-primary'
      }`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-semibold text-foreground leading-none">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
      </div>
    </CardContent>
  </Card>
);

const InsightChip: React.FC<{ type: string; title: string; description: string; priority: string }> = ({ type, title, description, priority }) => {
  const iconMap: Record<string, React.ReactNode> = {
    prediction: <TrendingDown className="h-3.5 w-3.5" />,
    recommendation: <Target className="h-3.5 w-3.5" />,
    trend: <TrendingUp className="h-3.5 w-3.5" />,
    alert: <AlertTriangle className="h-3.5 w-3.5" />,
  };
  const colorMap: Record<string, string> = {
    critical: 'border-critical/20 bg-critical-soft text-critical',
    high: 'border-warning/20 bg-warning-soft text-warning',
    positive: 'border-success/20 bg-success-soft text-success',
    medium: 'border-primary/20 bg-primary-soft text-primary',
    low: 'border-border bg-muted text-muted-foreground',
  };
  return (
    <div className={`flex-shrink-0 w-60 rounded-lg border p-3 space-y-1.5 ${colorMap[priority] || colorMap.medium}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {iconMap[type] || <Sparkles className="h-3 w-3" />}
        {type}
      </div>
      <p className="text-sm font-medium text-foreground leading-snug">{title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </div>
  );
};

const HandoverRow: React.FC<{ handover: any; expanded: boolean; onToggle: () => void }> = ({ handover, expanded, onToggle }) => {
  const progressVariant = handover.progress >= 80 ? 'success' : handover.progress >= 50 ? 'warning' : 'critical';
  
  return (
    <Card className={`enterprise-shadow overflow-hidden transition-all ${expanded ? 'ring-1 ring-primary/20' : ''}`}>
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm text-foreground truncate">{handover.exitingEmployee}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{handover.successor || 'Unassigned'}</span>
          </div>
          <span className="text-xs text-muted-foreground">{handover.department}</span>
        </div>
        <div className="w-28 hidden sm:block space-y-1">
          <Progress value={handover.progress} variant={progressVariant} className="h-1.5" />
          <span className="text-[11px] text-muted-foreground">{handover.progress}%</span>
        </div>
        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${
          handover.aiRiskLevel === 'critical' ? 'border-critical/30 text-critical bg-critical/5' :
          handover.aiRiskLevel === 'high' ? 'border-warning/30 text-warning bg-warning/5' :
          handover.aiRiskLevel === 'low' ? 'border-success/30 text-success bg-success/5' :
          'border-primary/30 text-primary bg-primary/5'
        }`}>
          {handover.aiRiskLevel}
        </Badge>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </div>
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/20 space-y-2 text-sm">
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
          <p className="text-xs text-muted-foreground">
            {handover.completedTasks}/{handover.taskCount} tasks · <span className="italic">{handover.aiRecommendation}</span>
          </p>
        </div>
      )}
    </Card>
  );
};

// --- Main Component ---

export const HRManagerDashboard: React.FC = () => {
  const [expandedHandover, setExpandedHandover] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Data hooks
  const { stats, loading: statsLoading, error: statsError } = useHandoverStats();
  const { handovers, loading: handoversLoading, error: handoversError } = useHandoversList();
  const { insights, loading: insightsLoading, error: insightsError } = useAIInsightsForHR();
  const { requests: managerRequests, loading: requestsLoading, respondToRequest } = useHelpRequests('manager');
  const { users, refetch: refetchUsers } = useUsersManagement();
  const { createHandover } = useRealHandovers();

  const isLoading = statsLoading || handoversLoading || insightsLoading;
  const managerEscalations = managerRequests.filter(r => r.request_type === 'manager');
  const pendingEscalations = managerEscalations.filter(r => r.status === 'pending').length;
  
  // KT Approval requests specifically
  const ktApprovalRequests = managerEscalations.filter(r => 
    r.message?.toLowerCase().includes('requesting approval to close') || 
    r.message?.toLowerCase().includes('tasks have been acknowledged')
  );
  const pendingKTApprovals = ktApprovalRequests.filter(r => r.status === 'pending');

  // Handover creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddExitingModalOpen, setIsAddExitingModalOpen] = useState(false);
  const [isAddSuccessorModalOpen, setIsAddSuccessorModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({ exitingEmployee: '', successor: '', department: '' });
  const [newUserData, setNewUserData] = useState({ email: '', role: '', department: '', password: '' });

  const exitingEmployees = users.filter(u => u.role === 'exiting');
  const successors = users.filter(u => u.role === 'successor');
  const filteredSuccessors = successors.filter(u => 
    u.id !== formData.exitingEmployee && (!formData.department || u.department === formData.department)
  );

  // Derived data
  const needsAttention = useMemo(() => {
    const noSuccessor = handovers.filter(h => !h.successorEmail);
    const lowProgress = handovers.filter(h => h.progress < 30 && h.successorEmail);
    return { noSuccessor, lowProgress };
  }, [handovers]);

  const filteredHandovers = useMemo(() => {
    let list = handovers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => 
        h.exitingEmployee.toLowerCase().includes(q) || h.successor.toLowerCase().includes(q) || 
        h.exitingEmployeeEmail.toLowerCase().includes(q) || (h.successorEmail || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(h => h.status === statusFilter);
    return list;
  }, [handovers, searchQuery, statusFilter]);

  // Handlers
  const handleCreateHandover = async () => {
    if (!formData.exitingEmployee) {
      toast({ title: "Error", description: "Please select an exiting employee", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const result = await createHandover(formData.exitingEmployee, formData.successor || undefined);
      if (result.error) throw new Error(result.error);
      toast({ title: "Success", description: "Handover created successfully!" });
      setIsCreateModalOpen(false);
      setFormData({ exitingEmployee: '', successor: '', department: '' });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create handover", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = async (role: 'exiting' | 'successor') => {
    if (!newUserData.email || !newUserData.role || !newUserData.department || !newUserData.password) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const { error: emailError } = await supabase.functions.invoke('send-signup-email', {
        body: { email: newUserData.email, role: newUserData.role, department: newUserData.department, password: newUserData.password },
      });
      if (emailError) throw emailError;
      toast({ title: "Success", description: `${role === 'exiting' ? 'Exiting employee' : 'Successor'} invited successfully!` });
      setNewUserData({ email: '', role: '', department: '', password: '' });
      if (role === 'exiting') setIsAddExitingModalOpen(false);
      else setIsAddSuccessorModalOpen(false);
      refetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add user", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveKT = async (requestId: string) => {
    await respondToRequest(requestId, 'KT has been approved. The handover is now officially closed. Great work!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hasErrors = statsError || handoversError || insightsError;
  const attentionCount = needsAttention.noSuccessor.length + needsAttention.lowProgress.length + pendingEscalations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Transition Hub</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor and manage all employee transitions
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton title="Export Report" />

            {/* Create Handover Dialog */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  New Handover
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Handover</DialogTitle>
                  <DialogDescription>Set up a new knowledge transfer process</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Exiting Employee</Label>
                    <Select value={formData.exitingEmployee} onValueChange={(v) => setFormData({...formData, exitingEmployee: v})}>
                      <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                      <SelectContent>
                        {exitingEmployees.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.email.split('@')[0]} — {u.department || 'No Dept'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Successor (Optional)</Label>
                    <Select value={formData.successor} onValueChange={(v) => setFormData({...formData, successor: v})}>
                      <SelectTrigger><SelectValue placeholder="Select successor" /></SelectTrigger>
                      <SelectContent>
                        {filteredSuccessors.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.email.split('@')[0]} — {u.department || 'No Dept'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleCreateHandover} className="flex-1" disabled={actionLoading || !formData.exitingEmployee}>
                      {actionLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Handover'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Exiting Employee Dialog */}
            <Dialog open={isAddExitingModalOpen} onOpenChange={setIsAddExitingModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9"><UserPlus className="w-3.5 h-3.5 mr-1.5" />Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Exiting Employee</DialogTitle>
                  <DialogDescription>Add a departing employee and send them a signup email</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email Address</Label>
                    <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="employee@company.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role</Label>
                    <Select value={newUserData.role} onValueChange={(v) => setNewUserData({...newUserData, role: v})}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent><SelectItem value="exiting">Exiting Employee</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Select value={newUserData.department} onValueChange={(v) => setNewUserData({...newUserData, department: v})}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password</Label>
                    <Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} placeholder="Enter password" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleAddUser('exiting')} className="flex-1" disabled={actionLoading}>
                      {actionLoading ? 'Adding...' : 'Add & Send Email'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddExitingModalOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Successor Dialog */}
            <Dialog open={isAddSuccessorModalOpen} onOpenChange={setIsAddSuccessorModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9"><UserPlus className="w-3.5 h-3.5 mr-1.5" />Add Successor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Successor</DialogTitle>
                  <DialogDescription>Add a new successor and send them a signup email</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email Address</Label>
                    <Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="successor@company.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Role</Label>
                    <Select value={newUserData.role} onValueChange={(v) => setNewUserData({...newUserData, role: v})}>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent><SelectItem value="successor">Successor</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Select value={newUserData.department} onValueChange={(v) => setNewUserData({...newUserData, department: v})}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password</Label>
                    <Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} placeholder="Enter password" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleAddUser('successor')} className="flex-1" disabled={actionLoading}>
                      {actionLoading ? 'Adding...' : 'Add & Send Email'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddSuccessorModalOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard icon={<BarChart3 className="h-4 w-4" />} value={`${stats.overallProgress}%`} label="Overall Progress" />
          <MetricCard icon={<UserX className="h-4 w-4" />} value={stats.exitingEmployees} label="Exiting" />
          <MetricCard icon={<UserCheck className="h-4 w-4" />} value={stats.successorsAssigned} label="Successors" />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} value={stats.completedHandovers} label="Completed" variant="success" />
          <MetricCard icon={<AlertTriangle className="h-4 w-4" />} value={stats.highRiskCount} label="At Risk" variant={stats.highRiskCount > 0 ? 'critical' : undefined} />
        </div>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <div className="rounded-lg border border-critical/20 bg-critical-soft px-4 py-3 text-sm text-critical flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Failed to load some data. Please refresh.
        </div>
      )}

      {/* KT Approval Requests — Prominent banner */}
      {pendingKTApprovals.length > 0 && (
        <Card className="border-success/30 bg-success/5 enterprise-shadow-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">KT Approval Required</h3>
                <p className="text-xs text-muted-foreground">{pendingKTApprovals.length} handover{pendingKTApprovals.length > 1 ? 's' : ''} ready for closure</p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingKTApprovals.map(req => (
                <div key={req.id} className="flex items-center justify-between gap-4 bg-card rounded-lg p-3 border border-success/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{req.task?.title || 'Handover'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="flex-shrink-0 bg-success hover:bg-success/90 text-success-foreground h-8"
                    onClick={() => handleApproveKT(req.id)}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                    Approve KT
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="handovers" className="text-xs">
            Handovers
            <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">{handovers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="escalations" className="text-xs">
            Escalations
            {pendingEscalations > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-4 px-1.5 text-[10px]">{pendingEscalations}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-5">
          {attentionCount > 0 && (
            <Card className="border-warning/20 bg-warning-soft enterprise-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <Zap className="h-4 w-4" />
                  {attentionCount} item{attentionCount > 1 ? 's' : ''} need attention
                </div>
                <div className="space-y-2">
                  {needsAttention.noSuccessor.map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-sm bg-card rounded-lg px-3 py-2.5 border">
                      <UserX className="h-3.5 w-3.5 text-critical flex-shrink-0" />
                      <span className="font-medium text-foreground">{h.exitingEmployee}</span>
                      <span className="text-muted-foreground text-xs">— no successor assigned</span>
                    </div>
                  ))}
                  {needsAttention.lowProgress.map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-sm bg-card rounded-lg px-3 py-2.5 border">
                      <TrendingDown className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                      <span className="font-medium text-foreground">{h.exitingEmployee} → {h.successor}</span>
                      <span className="text-muted-foreground text-xs">— only {h.progress}% complete</span>
                    </div>
                  ))}
                  {pendingEscalations > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-card rounded-lg px-3 py-2.5 border">
                      <HelpCircle className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                      <span className="font-medium text-foreground">{pendingEscalations} pending escalation{pendingEscalations > 1 ? 's' : ''}</span>
                      <span className="text-muted-foreground text-xs">from successors</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
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
              <p className="text-sm text-muted-foreground py-6 text-center">No AI insights available yet.</p>
            )}
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="enterprise-shadow"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-foreground">{stats.inProgressHandovers}</div><div className="text-xs text-muted-foreground mt-0.5">In Progress</div></CardContent></Card>
            <Card className="enterprise-shadow"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-foreground">{handovers.filter(h => h.status === 'review').length}</div><div className="text-xs text-muted-foreground mt-0.5">In Review</div></CardContent></Card>
            <Card className="enterprise-shadow"><CardContent className="p-4 text-center"><div className="text-2xl font-semibold text-success">{stats.completedHandovers}</div><div className="text-xs text-muted-foreground mt-0.5">Completed</div></CardContent></Card>
          </div>
        </TabsContent>

        {/* Handovers Tab */}
        <TabsContent value="handovers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue /></SelectTrigger>
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
                <HandoverRow key={h.id} handover={h} expanded={expandedHandover === h.id} onToggle={() => setExpandedHandover(expandedHandover === h.id ? null : h.id)} />
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{searchQuery || statusFilter !== 'all' ? 'No handovers match your filters.' : 'No handovers yet. Create your first one.'}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Escalations Tab */}
        <TabsContent value="escalations">
          <HelpRequestsPanel requests={managerEscalations} loading={requestsLoading} onRespond={respondToRequest} title="Escalations & Approvals" description="Successor requests and KT approval actions" emptyMessage="No escalations at this time." viewerRole="manager" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
