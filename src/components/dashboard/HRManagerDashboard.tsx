import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3, Users, AlertTriangle, TrendingUp, Brain, Sparkles, Target, 
  UserCheck, UserX, TrendingDown, CheckCircle2, Loader2, HelpCircle,
  Search, ChevronDown, ChevronUp, Zap, ArrowRight, Clock, Mail, Plus, UserPlus,
  CheckCheck, ShieldCheck, Send, Bell, Calendar, Shield, Activity,
  MessageSquare, Eye, FileText, RefreshCw
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

export const HRManagerDashboard: React.FC = () => {
  const [expandedHandover, setExpandedHandover] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nudgeModal, setNudgeModal] = useState<{ open: boolean; handover: any | null }>({ open: false, handover: null });
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [nudgeSending, setNudgeSending] = useState(false);
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
    const stalled = handovers.filter(h => h.progress > 0 && h.progress < 60 && h.status === 'in-progress');
    return { noSuccessor, lowProgress, stalled };
  }, [handovers]);

  const filteredHandovers = useMemo(() => {
    let list = handovers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => 
        h.exitingEmployee.toLowerCase().includes(q) || h.successor.toLowerCase().includes(q) || 
        h.exitingEmployeeEmail.toLowerCase().includes(q) || (h.successorEmail || '').toLowerCase().includes(q) ||
        h.department.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter(h => h.status === statusFilter);
    return list;
  }, [handovers, searchQuery, statusFilter]);

  // Department health
  const departmentHealth = useMemo(() => {
    const deptMap: Record<string, { total: number; avgProgress: number; atRisk: number; completed: number }> = {};
    handovers.forEach(h => {
      const dept = h.department || 'Unassigned';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, avgProgress: 0, atRisk: 0, completed: 0 };
      deptMap[dept].total++;
      deptMap[dept].avgProgress += h.progress;
      if (h.aiRiskLevel === 'critical' || h.aiRiskLevel === 'high') deptMap[dept].atRisk++;
      if (h.progress >= 90) deptMap[dept].completed++;
    });
    return Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      total: data.total,
      avgProgress: data.total > 0 ? Math.round(data.avgProgress / data.total) : 0,
      atRisk: data.atRisk,
      completed: data.completed,
    })).sort((a, b) => b.total - a.total);
  }, [handovers]);

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
    toast({ title: "KT Approved", description: "The handover has been officially closed." });
  };

  const handleSendNudge = async () => {
    if (!nudgeModal.handover || !nudgeMessage.trim()) return;
    setNudgeSending(true);
    try {
      // Log the nudge as an activity
      await supabase.rpc('log_activity', {
        p_action: 'manager_nudge',
        p_resource_type: 'handover',
        p_resource_id: nudgeModal.handover.id,
        p_details: { 
          message: nudgeMessage, 
          target: nudgeModal.handover.exitingEmployeeEmail,
          handover_progress: nudgeModal.handover.progress
        }
      });
      toast({ title: "Reminder Sent", description: `Nudge sent for ${nudgeModal.handover.exitingEmployee}'s handover.` });
      setNudgeModal({ open: false, handover: null });
      setNudgeMessage('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to send reminder", variant: "destructive" });
    } finally {
      setNudgeSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Loading dashboard</p>
            <p className="text-xs text-muted-foreground mt-1">Aggregating transition data...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasErrors = statsError || handoversError || insightsError;
  const attentionCount = needsAttention.noSuccessor.length + needsAttention.lowProgress.length + pendingEscalations;

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/3 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">Command Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Transition Hub</h1>
            <p className="text-muted-foreground max-w-lg">
              Monitor, manage, and accelerate all employee knowledge transfers across your organization.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton title="Export Report" variant="outline" size="sm" />
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 enterprise-shadow">
                  <Plus className="w-4 h-4" /> New Handover
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Create Handover</DialogTitle>
                  <DialogDescription>Set up a new knowledge transfer process</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Exiting Employee</Label>
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
                    <Label className="text-xs font-medium">Successor (Optional)</Label>
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

            <Dialog open={isAddExitingModalOpen} onOpenChange={setIsAddExitingModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="w-3.5 h-3.5" />Add Employee</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Add Exiting Employee</DialogTitle>
                  <DialogDescription>Add a departing employee and send them a signup email</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Email</Label><Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="employee@company.com" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Role</Label><Select value={newUserData.role} onValueChange={(v) => setNewUserData({...newUserData, role: v})}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent><SelectItem value="exiting">Exiting Employee</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Department</Label><Select value={newUserData.department} onValueChange={(v) => setNewUserData({...newUserData, department: v})}><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Password</Label><Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} placeholder="Enter password" /></div>
                  <div className="flex gap-2 pt-2"><Button onClick={() => handleAddUser('exiting')} className="flex-1" disabled={actionLoading}>{actionLoading ? 'Adding...' : 'Add & Send Email'}</Button><Button variant="outline" onClick={() => setIsAddExitingModalOpen(false)}>Cancel</Button></div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddSuccessorModalOpen} onOpenChange={setIsAddSuccessorModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="w-3.5 h-3.5" />Add Successor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Add Successor</DialogTitle>
                  <DialogDescription>Add a new successor and send them a signup email</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Email</Label><Input type="email" value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} placeholder="successor@company.com" /></div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Role</Label><Select value={newUserData.role} onValueChange={(v) => setNewUserData({...newUserData, role: v})}><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger><SelectContent><SelectItem value="successor">Successor</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Department</Label><Select value={newUserData.department} onValueChange={(v) => setNewUserData({...newUserData, department: v})}><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs font-medium">Password</Label><Input type="password" value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} placeholder="Enter password" /></div>
                  <div className="flex gap-2 pt-2"><Button onClick={() => handleAddUser('successor')} className="flex-1" disabled={actionLoading}>{actionLoading ? 'Adding...' : 'Add & Send Email'}</Button><Button variant="outline" onClick={() => setIsAddSuccessorModalOpen(false)}>Cancel</Button></div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Overall Progress', value: `${stats.overallProgress}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/8' },
          { label: 'Active Handovers', value: stats.totalHandovers, icon: Activity, color: 'text-primary', bg: 'bg-primary/8' },
          { label: 'Successors Paired', value: stats.successorsAssigned, icon: UserCheck, color: 'text-success', bg: 'bg-success/8' },
          { label: 'Completed', value: stats.completedHandovers, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/8' },
          { label: 'At Risk', value: stats.highRiskCount, icon: AlertTriangle, color: stats.highRiskCount > 0 ? 'text-critical' : 'text-muted-foreground', bg: stats.highRiskCount > 0 ? 'bg-critical/8' : 'bg-muted/50' },
        ].map((metric) => (
          <Card key={metric.label} className="enterprise-shadow hover:enterprise-shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${metric.bg} flex items-center justify-center flex-shrink-0`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <Card className="border-critical/20 bg-critical/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-critical flex-shrink-0" />
            <p className="text-sm text-critical">Failed to load some data. Please refresh.</p>
            <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KT Approval Requests — Prominent */}
      {pendingKTApprovals.length > 0 && (
        <Card className="enterprise-shadow-md overflow-hidden border-success/30">
          <CardContent className="p-0">
            <div className="bg-success/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">KT Approval Required</h3>
                  <p className="text-xs text-muted-foreground">{pendingKTApprovals.length} handover{pendingKTApprovals.length > 1 ? 's' : ''} ready for official closure</p>
                </div>
              </div>
              <div className="space-y-2">
                {pendingKTApprovals.map(req => (
                  <div key={req.id} className="flex items-center justify-between gap-4 bg-card rounded-xl p-4 border enterprise-shadow">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{req.task?.title || 'Handover Completion'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{req.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      className="flex-shrink-0 bg-success hover:bg-success/90 text-success-foreground h-9 px-4 gap-1.5"
                      onClick={() => handleApproveKT(req.id)}
                    >
                      <CheckCheck className="h-4 w-4" />
                      Approve & Close
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-11">
          <TabsTrigger value="overview" className="text-xs gap-1.5 data-[state=active]:enterprise-shadow">
            <Eye className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="handovers" className="text-xs gap-1.5 data-[state=active]:enterprise-shadow">
            <Users className="h-3.5 w-3.5" /> Handovers
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{handovers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="departments" className="text-xs gap-1.5 data-[state=active]:enterprise-shadow">
            <BarChart3 className="h-3.5 w-3.5" /> Departments
          </TabsTrigger>
          <TabsTrigger value="escalations" className="text-xs gap-1.5 data-[state=active]:enterprise-shadow">
            <MessageSquare className="h-3.5 w-3.5" /> Escalations
            {pendingEscalations > 0 && (
              <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px]">{pendingEscalations}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Needs Attention */}
          {attentionCount > 0 && (
            <Card className="enterprise-shadow-md overflow-hidden border-warning/20">
              <CardContent className="p-0">
                <div className="bg-warning/5 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{attentionCount} item{attentionCount > 1 ? 's' : ''} need your attention</h3>
                      <p className="text-xs text-muted-foreground">Take action to keep transitions on track</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {needsAttention.noSuccessor.map(h => (
                      <div key={h.id} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border enterprise-shadow">
                        <div className="h-8 w-8 rounded-lg bg-critical/10 flex items-center justify-center flex-shrink-0">
                          <UserX className="h-4 w-4 text-critical" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-foreground">{h.exitingEmployee}</span>
                          <span className="text-xs text-muted-foreground ml-2">No successor assigned</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setFormData({ ...formData, exitingEmployee: '' }); setIsCreateModalOpen(true); }}>
                          <UserPlus className="h-3 w-3" /> Assign
                        </Button>
                      </div>
                    ))}
                    {needsAttention.lowProgress.map(h => (
                      <div key={h.id} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border enterprise-shadow">
                        <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <TrendingDown className="h-4 w-4 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-foreground">{h.exitingEmployee} → {h.successor}</span>
                          <span className="text-xs text-muted-foreground ml-2">Only {h.progress}% complete</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => { setNudgeModal({ open: true, handover: h }); setNudgeMessage(`Hi ${h.exitingEmployee}, your handover is at ${h.progress}% progress. Please prioritize completing your knowledge transfer tasks.`); }}>
                          <Bell className="h-3 w-3" /> Nudge
                        </Button>
                      </div>
                    ))}
                    {pendingEscalations > 0 && (
                      <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border enterprise-shadow">
                        <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <HelpCircle className="h-4 w-4 text-warning" />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm text-foreground">{pendingEscalations} pending escalation{pendingEscalations > 1 ? 's' : ''}</span>
                          <span className="text-xs text-muted-foreground ml-2">from successors</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">AI Insights</h3>
                  <p className="text-xs text-muted-foreground">Machine-generated recommendations based on transition data</p>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                {insights.map((insight, i) => (
                  <div key={i} className={`flex-shrink-0 w-64 rounded-xl border p-4 space-y-2 enterprise-shadow ${
                    insight.priority === 'critical' ? 'border-critical/20 bg-critical/3' :
                    insight.priority === 'high' ? 'border-warning/20 bg-warning/3' :
                    insight.priority === 'positive' ? 'border-success/20 bg-success/3' :
                    'border-primary/20 bg-primary/3'
                  }`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      {insight.type}
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{insight.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Not Started', value: handovers.filter(h => h.progress === 0).length, color: 'text-muted-foreground', bg: 'bg-muted/50' },
              { label: 'In Progress', value: stats.inProgressHandovers, color: 'text-primary', bg: 'bg-primary/8' },
              { label: 'In Review', value: handovers.filter(h => h.status === 'review').length, color: 'text-warning', bg: 'bg-warning/8' },
              { label: 'Completed', value: stats.completedHandovers, color: 'text-success', bg: 'bg-success/8' },
            ].map(item => (
              <Card key={item.label} className="enterprise-shadow">
                <CardContent className="p-5 text-center">
                  <p className={`text-3xl font-bold ${item.color} leading-none`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ===== HANDOVERS TAB ===== */}
        <TabsContent value="handovers" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, or department..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">In Review</SelectItem>
                <SelectItem value="pending">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            {filteredHandovers.length > 0 ? (
              filteredHandovers.map(h => {
                const isExpanded = expandedHandover === h.id;
                const progressVariant = h.progress >= 80 ? 'success' : h.progress >= 50 ? 'warning' : 'critical';
                
                return (
                  <Card key={h.id} className={`enterprise-shadow overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-primary/20 enterprise-shadow-md' : ''} ${
                    h.aiRiskLevel === 'critical' ? 'border-l-4 border-l-critical' :
                    h.aiRiskLevel === 'high' ? 'border-l-4 border-l-warning' :
                    h.progress >= 90 ? 'border-l-4 border-l-success' :
                    'border-l-4 border-l-border'
                  }`}>
                    <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpandedHandover(isExpanded ? null : h.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{h.exitingEmployee}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{h.successor || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted/50 rounded-md">{h.department}</span>
                          <span className="text-[11px] text-muted-foreground">{h.completedTasks}/{h.taskCount} tasks</span>
                        </div>
                      </div>
                      <div className="w-32 hidden sm:block space-y-1.5">
                        <Progress value={h.progress} variant={progressVariant as any} className="h-2" />
                        <span className="text-xs font-medium text-muted-foreground">{h.progress}%</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-semibold ${
                        h.aiRiskLevel === 'critical' ? 'border-critical/40 text-critical bg-critical/5' :
                        h.aiRiskLevel === 'high' ? 'border-warning/40 text-warning bg-warning/5' :
                        h.aiRiskLevel === 'low' ? 'border-success/40 text-success bg-success/5' :
                        'border-primary/40 text-primary bg-primary/5'
                      }`}>
                        {h.aiRiskLevel} risk
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {isExpanded && (
                      <div className="border-t bg-muted/10 p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2.5">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Exiting Employee</p>
                              <p className="text-xs text-foreground">{h.exitingEmployeeEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Successor</p>
                              <p className="text-xs text-foreground">{h.successorEmail || 'Not assigned'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Created</p>
                              <p className="text-xs text-foreground">{new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* AI Recommendation */}
                        <div className="bg-primary/3 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">AI Recommendation</p>
                            <p className="text-xs text-foreground">{h.aiRecommendation}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hover:bg-warning/5 hover:text-warning hover:border-warning/30"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setNudgeModal({ open: true, handover: h }); 
                              setNudgeMessage(`Hi ${h.exitingEmployee}, your handover is at ${h.progress}% progress. Please prioritize completing your knowledge transfer tasks.`); 
                            }}>
                            <Bell className="h-3.5 w-3.5" /> Send Reminder
                          </Button>
                          {!h.successorEmail && (
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                              onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); }}>
                              <UserPlus className="h-3.5 w-3.5" /> Assign Successor
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <Card className="enterprise-shadow-md">
                <CardContent className="p-16 text-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                    <Users className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No Handovers Found</p>
                    <p className="text-xs text-muted-foreground mt-1">{searchQuery || statusFilter !== 'all' ? 'No handovers match your filters.' : 'Create your first handover to get started.'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ===== DEPARTMENTS TAB ===== */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Department Health</h3>
              <p className="text-xs text-muted-foreground">Knowledge transfer status by organizational unit</p>
            </div>
          </div>
          
          {departmentHealth.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentHealth.map(dept => (
                <Card key={dept.department} className={`enterprise-shadow hover:enterprise-shadow-md transition-shadow ${
                  dept.atRisk > 0 ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-success'
                }`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-foreground">{dept.department}</h4>
                        <p className="text-xs text-muted-foreground">{dept.total} active handover{dept.total > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary leading-none">{dept.avgProgress}%</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">avg progress</p>
                      </div>
                    </div>
                    <Progress value={dept.avgProgress} className="h-2" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center bg-muted/30 rounded-lg p-2">
                        <p className="text-sm font-bold text-foreground">{dept.total}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center bg-success/5 rounded-lg p-2">
                        <p className="text-sm font-bold text-success">{dept.completed}</p>
                        <p className="text-[10px] text-muted-foreground">Done</p>
                      </div>
                      <div className={`text-center rounded-lg p-2 ${dept.atRisk > 0 ? 'bg-critical/5' : 'bg-muted/30'}`}>
                        <p className={`text-sm font-bold ${dept.atRisk > 0 ? 'text-critical' : 'text-muted-foreground'}`}>{dept.atRisk}</p>
                        <p className="text-[10px] text-muted-foreground">At Risk</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="enterprise-shadow">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No department data available yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== ESCALATIONS TAB ===== */}
        <TabsContent value="escalations">
          <HelpRequestsPanel requests={managerEscalations} loading={requestsLoading} onRespond={respondToRequest} title="Escalations & Approvals" description="Successor requests and KT approval actions" emptyMessage="No escalations at this time." viewerRole="manager" />
        </TabsContent>
      </Tabs>

      {/* Nudge / Reminder Modal */}
      <Dialog open={nudgeModal.open} onOpenChange={(open) => { if (!open) { setNudgeModal({ open: false, handover: null }); setNudgeMessage(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" /> Send Reminder
            </DialogTitle>
            <DialogDescription>
              Nudge {nudgeModal.handover?.exitingEmployee} to prioritize their handover ({nudgeModal.handover?.progress}% complete)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reminder Message</Label>
              <Textarea 
                value={nudgeMessage}
                onChange={(e) => setNudgeMessage(e.target.value)}
                className="min-h-[100px] text-sm"
                placeholder="Type your reminder..."
              />
            </div>
            <div className="bg-muted/30 rounded-xl p-3 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Handover Details</p>
              <p className="text-xs text-foreground">{nudgeModal.handover?.exitingEmployee} → {nudgeModal.handover?.successor}</p>
              <p className="text-xs text-muted-foreground">{nudgeModal.handover?.department} · {nudgeModal.handover?.completedTasks}/{nudgeModal.handover?.taskCount} tasks</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSendNudge} className="flex-1 gap-1.5" disabled={nudgeSending || !nudgeMessage.trim()}>
                {nudgeSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {nudgeSending ? 'Sending...' : 'Send Reminder'}
              </Button>
              <Button variant="outline" onClick={() => { setNudgeModal({ open: false, handover: null }); setNudgeMessage(''); }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
