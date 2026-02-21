import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertTriangle, MessageCircle, HelpCircle, Clock, CheckCircle,
  FileText, Loader2, CheckCheck, Sparkles, TrendingUp,
  BarChart3, Shield, Lightbulb, Target
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ExpandableText } from '@/components/ui/expandable-text';
import { SuccessorAIInsights } from './SuccessorAIInsights';
import { TaskAISummaryModal } from './TaskAISummaryModal';
import { WhatsAppChat } from './WhatsAppChat';
import { AIChatBot, AIFloatingButton } from './AIChatBot';
import { useHandover } from '@/hooks/useHandover';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useMeetings } from '@/hooks/useMeetings';
import { useAuth } from '@/contexts/AuthContext';
import { HandoverTask } from '@/types/handover';
import { supabase } from '@/integrations/supabase/client';

export const SuccessorDashboard: React.FC = () => {
  const { tasks, loading, error, acknowledgeTask } = useHandover();
  const { user } = useAuth();
  const { requests: helpRequests, loading: helpLoading, createRequest, resolveRequest } = useHelpRequests('successor');
  const { getMeetingsForTask } = useMeetings();
  const [notesModal, setNotesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HandoverTask | null>(null);
  const [acknowledgingTaskId, setAcknowledgingTaskId] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [aiSummaryModal, setAiSummaryModal] = useState<{ isOpen: boolean; task: HandoverTask | null }>({ isOpen: false, task: null });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatType, setChatType] = useState<'employee' | 'manager'>('employee');
  const [chatTaskFilter, setChatTaskFilter] = useState<string | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [handoverInfo, setHandoverInfo] = useState<{
    handoverId: string;
    exitingEmployeeName: string;
    department: string;
  } | null>(null);
  const [approvalSent, setApprovalSent] = useState(false);

  // Fetch handover info
  useEffect(() => {
    const fetchHandoverInfo = async () => {
      if (!user) return;
      try {
        const { data: handovers, error: handoverError } = await supabase
          .from('handovers')
          .select(`id, employee_id, users!handovers_employee_id_fkey (email, department)`)
          .eq('successor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (handoverError) return;
        if (handovers && handovers.length > 0) {
          const handover = handovers[0];
          const employeeData = handover.users as any;
          setHandoverInfo({
            handoverId: handover.id,
            exitingEmployeeName: employeeData?.email?.split('@')[0] || 'Predecessor',
            department: employeeData?.department || 'General'
          });
        }
      } catch (err) { console.error('Error fetching handover info:', err); }
    };
    fetchHandoverInfo();
  }, [user]);

  useEffect(() => {
    if (handoverInfo) {
      const alreadySent = helpRequests.some(r => 
        r.request_type === 'manager' && 
        (r.message?.toLowerCase().includes('requesting approval to close') || r.message?.toLowerCase().includes('tasks have been acknowledged'))
      );
      setApprovalSent(alreadySent);
    }
  }, [helpRequests, handoverInfo]);

  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round(completedTasks.length / totalTasks * 100) : 0;
  const allAcknowledged = completedTasks.length > 0 && completedTasks.every(t => t.successorAcknowledged);
  const allTasksDone = totalTasks > 0 && completedTasks.length === totalTasks;
  const readyForApproval = allTasksDone && allAcknowledged;
  const acknowledgedCount = completedTasks.filter(t => t.successorAcknowledged).length;
  const criticalGaps = pendingTasks.filter(task => task.priority === 'critical').slice(0, 3).map(task => task.title);

  const openChat = (type: 'employee' | 'manager', taskId?: string) => {
    setChatType(type);
    setChatTaskFilter(taskId || null);
    setChatOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Loading handover</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-sm w-full enterprise-shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-6 w-6 text-critical mx-auto" />
            <p className="text-sm font-semibold text-foreground">Connection Error</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TaskCard: React.FC<{ task: HandoverTask; variant: 'completed' | 'pending' }> = ({ task, variant }) => {
    const taskReqs = helpRequests.filter(r => r.task_id === task.id);
    const pendingQs = taskReqs.filter(r => r.status === 'pending').length;
    const answeredQs = taskReqs.filter(r => r.response).length;
    const taskMeetings = getMeetingsForTask(task.id).filter(m => m.ai_summary);

    return (
      <Card className={`enterprise-shadow transition-all hover:enterprise-shadow-md group ${
        variant === 'completed' 
          ? 'border-l-4 border-l-success' 
          : task.priority === 'critical' ? 'border-l-4 border-l-critical' :
            task.priority === 'high' ? 'border-l-4 border-l-warning' :
            'border-l-4 border-l-border'
      }`}>
        <CardContent className="p-4 space-y-2">
          {/* Header — compact */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground leading-snug flex-1 min-w-0">{task.title}</h4>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.successorAcknowledged && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                  <CheckCheck className="w-2.5 h-2.5 mr-0.5" /> ACK
                </Badge>
              )}
              {/* Question tag on card */}
              {taskReqs.length > 0 && (
                <Badge 
                  variant="outline" 
                  className={`text-[10px] px-1.5 py-0 cursor-pointer ${
                    pendingQs > 0 ? 'border-warning/40 text-warning bg-warning/5' : 'border-success/40 text-success bg-success/5'
                  }`}
                  onClick={() => openChat('employee', task.id)}
                >
                  <MessageCircle className="h-2.5 w-2.5 mr-0.5" />{answeredQs}/{taskReqs.length}
                </Badge>
              )}
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${
                variant === 'completed' ? 'border-success/40 text-success bg-success/5' : 
                task.priority === 'critical' ? 'border-critical/40 text-critical bg-critical/5' :
                task.priority === 'high' ? 'border-warning/40 text-warning bg-warning/5' :
                'border-primary/40 text-primary bg-primary/5'
              }`}>
                {variant === 'completed' ? 'Done' : task.priority}
              </Badge>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="px-1.5 py-0.5 bg-muted/50 rounded font-medium">{task.category}</span>
            {task.dueDate && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(task.dueDate).toLocaleDateString()}</span>
            )}
          </div>

          {/* Individual insight cards with timestamps */}
          {task.insights && task.insights.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5">
              {task.insights.map(insight => (
                <div key={insight.id} className="bg-primary/3 border border-primary/10 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Lightbulb className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-semibold text-primary">{insight.topic}</span>
                    <span className="text-[10px] text-muted-foreground/60 ml-auto">
                      {new Date(insight.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{insight.content}</p>
                  {insight.attachments?.length > 0 && (
                    <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5">
                      <FileText className="h-2.5 w-2.5" /> {insight.attachments.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes fallback — compact card */}
          {task.notes && (!task.insights || task.insights.length === 0) && (
            <div className="bg-muted/30 border rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <FileText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-foreground">Notes</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">{task.notes}</p>
            </div>
          )}

          {/* Meeting summaries — compact */}
          {taskMeetings.length > 0 && taskMeetings.slice(0, 1).map(meeting => (
            <div key={meeting.id} className="rounded-lg border border-primary/15 bg-primary/3 p-2.5 flex items-start gap-2">
              <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-foreground">{meeting.title}</span>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{meeting.ai_summary}</p>
              </div>
            </div>
          ))}

          {/* Actions — compact */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button variant="outline" size="sm" onClick={() => setAiSummaryModal({ isOpen: true, task })} className="h-7 text-[11px] px-2.5 gap-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
              <Sparkles className="w-3 h-3" /> AI Insights
            </Button>
            {task.notes && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedTask(task); setNotesModal(true); }} className="h-7 text-[11px] px-2.5 gap-1">
                <FileText className="w-3 h-3" /> View Notes
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => openChat('employee', task.id)} className="h-7 text-[11px] px-2.5 gap-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
              <MessageCircle className="w-3 h-3" /> Ask Employee
            </Button>
            <Button variant="outline" size="sm" onClick={() => openChat('manager', task.id)} className="h-7 text-[11px] px-2.5 gap-1 hover:bg-warning/5 hover:text-warning hover:border-warning/30">
              <HelpCircle className="w-3 h-3" /> Escalate
            </Button>
            {variant === 'completed' && !task.successorAcknowledged && (
              <Button size="sm" disabled={acknowledgingTaskId === task.id} className="h-7 text-[11px] px-3 ml-auto gap-1"
                onClick={async () => { setAcknowledgingTaskId(task.id); await acknowledgeTask(task.id); setAcknowledgingTaskId(null); }}>
                {acknowledgingTaskId === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                Acknowledge KT
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">Incoming Transfer</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Knowledge Handover</h1>
            <p className="text-muted-foreground max-w-md">
              Receiving knowledge from <span className="font-semibold text-foreground">{handoverInfo?.exitingEmployeeName || 'your predecessor'}</span>
              {handoverInfo?.department && <span> · {handoverInfo.department}</span>}
            </p>
          </div>
          <ExportButton title="Export Handover" variant="outline" size="sm" />
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Transfer Progress', value: `${progressPercentage}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/8' },
          { label: 'Tasks Completed', value: `${completedTasks.length}/${totalTasks}`, icon: CheckCircle, color: 'text-success', bg: 'bg-success/8' },
          { label: 'Acknowledged', value: `${acknowledgedCount}/${completedTasks.length}`, icon: CheckCheck, color: 'text-primary', bg: 'bg-primary/8' },
          { label: 'Critical Gaps', value: criticalGaps.length.toString(), icon: AlertTriangle, color: criticalGaps.length > 0 ? 'text-critical' : 'text-muted-foreground', bg: criticalGaps.length > 0 ? 'bg-critical/8' : 'bg-muted/50' },
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

      {/* Progress Bar */}
      <Card className="enterprise-shadow-md overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold text-foreground">Overall Progress</span>
            <span className="text-sm font-bold text-primary">{progressPercentage}%</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{pendingTasks.length} tasks remaining · {acknowledgedCount} acknowledged</p>
          <Progress value={progressPercentage} className="h-2.5" />
        </CardContent>
      </Card>

      {/* KT Approval Request */}
      {readyForApproval && handoverInfo && (
        <Card className={`enterprise-shadow-md overflow-hidden ${approvalSent ? 'border-success/30' : 'border-primary/30'}`}>
          <CardContent className="p-6 text-center space-y-4">
            <div className={`h-14 w-14 rounded-2xl mx-auto flex items-center justify-center ${approvalSent ? 'bg-success/15' : 'bg-primary/15'}`}>
              <Shield className={`h-7 w-7 ${approvalSent ? 'text-success' : 'text-primary'}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{approvalSent ? 'Approval Request Submitted' : 'All Tasks Acknowledged'}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {approvalSent 
                  ? 'Your KT approval request has been sent to the manager.'
                  : 'All knowledge transfer items reviewed. Request manager approval to close.'}
              </p>
            </div>
            {!approvalSent && (
              <Button size="lg" onClick={async () => {
                await createRequest(tasks[0].id, handoverInfo.handoverId, 'manager',
                  `All ${totalTasks} tasks have been acknowledged by the successor. Requesting approval to close the handover for ${handoverInfo.exitingEmployeeName}.`);
                setApprovalSent(true);
              }} className="gap-2">
                <CheckCheck className="h-4 w-4" /> Request KT Approval from Manager
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <SuccessorAIInsights 
        handoverId={handoverInfo?.handoverId}
        tasks={tasks}
        exitingEmployeeName={handoverInfo?.exitingEmployeeName}
        department={handoverInfo?.department}
      />

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <Card className="border-critical/20 enterprise-shadow overflow-hidden">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-critical/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-critical" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Critical Knowledge Gaps</h3>
              <ul className="mt-2 space-y-1">
                {criticalGaps.map((gap, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-critical flex-shrink-0" />{gap}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Completed Tasks</h2>
              <p className="text-xs text-muted-foreground">{completedTasks.length} items · {acknowledgedCount} acknowledged</p>
            </div>
          </div>
          <div className="space-y-2">
            {completedTasks.map(task => <TaskCard key={task.id} task={task} variant="completed" />)}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Awaiting Knowledge Transfer</h2>
              <p className="text-xs text-muted-foreground">{pendingTasks.length} items pending</p>
            </div>
          </div>
          <div className="space-y-2">
            {pendingTasks.map(task => <TaskCard key={task.id} task={task} variant="pending" />)}
          </div>
        </div>
      )}

      {totalTasks === 0 && (
        <Card className="enterprise-shadow-md">
          <CardContent className="p-16 text-center space-y-4">
            <FileText className="h-7 w-7 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">No Handover Tasks</p>
            <p className="text-xs text-muted-foreground">No knowledge transfer tasks have been assigned yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <TaskAISummaryModal
        isOpen={aiSummaryModal.isOpen}
        onClose={() => setAiSummaryModal({ isOpen: false, task: null })}
        task={aiSummaryModal.task}
        exitingEmployeeName={handoverInfo?.exitingEmployeeName}
      />

      {/* WhatsApp-style Chat for Employee Questions */}
      <WhatsAppChat
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatTaskFilter(null); }}
        requests={
          chatTaskFilter 
            ? helpRequests.filter(r => r.task_id === chatTaskFilter && r.request_type === chatType)
            : helpRequests.filter(r => r.request_type === chatType)
        }
        onSendMessage={async (message) => {
          if (!handoverInfo || !chatTaskFilter) return;
          setSendingRequest(true);
          await createRequest(chatTaskFilter, handoverInfo.handoverId, chatType, message);
          setSendingRequest(false);
        }}
        onRespond={async () => false}
        onResolve={resolveRequest}
        title={chatType === 'employee' ? `Chat with ${handoverInfo?.exitingEmployeeName || 'Employee'}` : 'Manager Escalations'}
        subtitle={chatType === 'employee' ? 'Ask questions about specific tasks' : 'Request additional support'}
        currentUserRole="successor"
        taskContext={chatTaskFilter ? tasks.find(t => t.id === chatTaskFilter) ? { title: tasks.find(t => t.id === chatTaskFilter)!.title, category: tasks.find(t => t.id === chatTaskFilter)!.category } : null : null}
        loading={sendingRequest}
      />

      {/* Notes modal */}
      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-bold">{selectedTask?.title}</DialogTitle>
                <DialogDescription className="mt-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{selectedTask?.category}</Badge>
                    <Badge variant={selectedTask?.status === 'completed' ? 'default' : 'secondary'} className={`text-[10px] ${selectedTask?.status === 'completed' ? 'bg-success text-success-foreground' : ''}`}>
                      {selectedTask?.status === 'completed' ? 'Completed' : selectedTask?.status}
                    </Badge>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-5">
            {selectedTask?.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overview</h4>
                <div className="bg-muted/30 border rounded-xl p-4">
                  <p className="text-sm text-foreground leading-relaxed">{selectedTask.description}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">KT Notes</h4>
              {selectedTask?.notes ? (
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                  <ExpandableText text={selectedTask.notes} maxLines={5} />
                </div>
              ) : (
                <div className="bg-muted/20 border border-dashed rounded-xl p-8 text-center">
                  <p className="text-xs text-muted-foreground">No notes added yet.</p>
                </div>
              )}
            </div>

            {selectedTask?.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What This Means For You</h4>
                <div className="bg-success/5 border border-success/15 rounded-xl p-4">
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />Review and understand the documented knowledge thoroughly</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />Note any clarifications needed before handover completes</li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" />Acknowledge once you've fully understood the knowledge</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-auto">
            {selectedTask?.successorAcknowledged ? (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4">
                <CheckCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Knowledge Acknowledged</p>
                  {selectedTask.successorAcknowledgedAt && (
                    <p className="text-xs text-muted-foreground">
                      Confirmed {new Date(selectedTask.successorAcknowledgedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Review notes and acknowledge when ready</p>
                <Button size="sm" onClick={async () => {
                  if (selectedTask) { setAcknowledgingTaskId(selectedTask.id); await acknowledgeTask(selectedTask.id); setAcknowledgingTaskId(null); setNotesModal(false); }
                }} disabled={acknowledgingTaskId === selectedTask?.id} className="gap-1.5">
                  {acknowledgingTaskId === selectedTask?.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Acknowledge KT
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Chatbot */}
      <AIChatBot
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        tasks={tasks}
        userRole="successor"
        contextInfo={{
          handoverProgress: progressPercentage,
          exitingEmployeeName: handoverInfo?.exitingEmployeeName,
          department: handoverInfo?.department
        }}
      />
      <AIFloatingButton onClick={() => setAiChatOpen(true)} />
    </div>
  );
};
