import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, MessageCircle, HelpCircle, Clock, CheckCircle,
  FileText, User, Loader2, CheckCheck, Sparkles
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ExpandableText } from '@/components/ui/expandable-text';
import { SuccessorAIInsights } from './SuccessorAIInsights';
import { TaskHelpRequestModal } from './TaskHelpRequestModal';
import { TaskAISummaryModal } from './TaskAISummaryModal';
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
  const [expandedHelpTasks, setExpandedHelpTasks] = useState<Record<string, boolean>>({});
  const [selectedTask, setSelectedTask] = useState<HandoverTask | null>(null);
  const [acknowledgingTaskId, setAcknowledgingTaskId] = useState<string | null>(null);
  const [helpRequestModal, setHelpRequestModal] = useState<{
    isOpen: boolean;
    task: HandoverTask | null;
    type: 'employee' | 'manager';
  }>({ isOpen: false, task: null, type: 'employee' });
  const [sendingRequest, setSendingRequest] = useState(false);
  const [aiSummaryModal, setAiSummaryModal] = useState<{
    isOpen: boolean;
    task: HandoverTask | null;
  }>({ isOpen: false, task: null });
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

        if (handoverError) { console.error('Error fetching handover info:', handoverError); return; }
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

  // Check if approval was already sent
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

  const criticalGaps = pendingTasks.filter(task => task.priority === 'critical').slice(0, 3).map(task => task.title);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading handover data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <p className="text-sm text-critical">Error loading handover data</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const TaskCard: React.FC<{ task: HandoverTask; variant: 'completed' | 'pending' }> = ({ task, variant }) => {
    const taskReqs = helpRequests.filter(r => r.task_id === task.id);
    const isExpanded = expandedHelpTasks[`${variant[0]}-${task.id}`] || false;
    const taskMeetings = getMeetingsForTask(task.id).filter(m => m.ai_summary);

    return (
      <Card className={`enterprise-shadow transition-all hover:enterprise-shadow-md ${
        variant === 'completed' ? 'border-success/15' : 'border-warning/15'
      }`}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${variant === 'completed' ? 'text-foreground' : 'text-foreground'}`}>
                {task.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">{task.category}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.successorAcknowledged && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                  <CheckCheck className="w-2.5 h-2.5 mr-0.5" /> Acknowledged
                </Badge>
              )}
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                variant === 'completed' ? 'border-success/30 text-success bg-success/5' : 'border-warning/30 text-warning bg-warning/5'
              }`}>
                {variant === 'completed' ? 'Done' : task.priority}
              </Badge>
            </div>
          </div>

          {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}

          {/* Help Requests */}
          {taskReqs.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <button
                className="flex items-center gap-2 w-full text-left"
                onClick={() => setExpandedHelpTasks(prev => ({ ...prev, [`${variant[0]}-${task.id}`]: !isExpanded }))}
              >
                <MessageCircle className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-foreground">Help Requests ({taskReqs.length})</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{isExpanded ? '▲' : '▼'}</span>
              </button>
              {isExpanded && (
                <div className="mt-2 space-y-1.5">
                  {taskReqs.map(req => (
                    <div key={req.id} className="text-xs space-y-0.5 bg-card rounded p-2 border border-border/40">
                      <div className="flex items-center justify-between">
                        <p className="text-foreground">{req.message}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {req.response && (
                        <div className="flex items-center justify-between pt-0.5">
                          <p className="text-success">↳ {req.response}</p>
                          {req.responded_at && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(req.responded_at).toLocaleDateString()} {new Date(req.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{req.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meeting Summaries */}
          {taskMeetings.length > 0 && (
            <div className="space-y-1.5">
              {taskMeetings.map(meeting => (
                <div key={meeting.id} className="rounded-lg border border-primary/15 bg-primary/5 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-medium text-foreground">{meeting.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{meeting.ai_summary}</p>
                  {meeting.ai_action_items?.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-medium text-foreground">Action Items:</span>
                      {meeting.ai_action_items.map((item: any, idx: number) => (
                        <div key={idx} className="text-[11px] flex items-center gap-1">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{item.priority}</Badge>
                          <span className="text-muted-foreground">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setAiSummaryModal({ isOpen: true, task })} className="h-7 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/5">
              <Sparkles className="w-3 h-3 mr-1" /> AI Insights
            </Button>
            {task.notes && (
              <Button variant="ghost" size="sm" onClick={() => { setSelectedTask(task); setNotesModal(true); }} className="h-7 text-[11px] px-2">
                <FileText className="w-3 h-3 mr-1" /> Notes
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setHelpRequestModal({ isOpen: true, task, type: 'employee' })} className="h-7 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/5">
              <MessageCircle className="w-3 h-3 mr-1" /> Ask Employee
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setHelpRequestModal({ isOpen: true, task, type: 'manager' })} className="h-7 text-[11px] px-2 text-warning hover:text-warning hover:bg-warning/5">
              <HelpCircle className="w-3 h-3 mr-1" /> Escalate
            </Button>
            {variant === 'completed' && !task.successorAcknowledged && (
              <Button size="sm" disabled={acknowledgingTaskId === task.id} className="h-7 text-[11px] px-2.5 ml-auto"
                onClick={async () => { setAcknowledgingTaskId(task.id); await acknowledgeTask(task.id); setAcknowledgingTaskId(null); }}>
                {acknowledgingTaskId === task.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCheck className="w-3 h-3 mr-1" />}
                Acknowledge KT
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Incoming Handover</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Knowledge transfer from {handoverInfo?.exitingEmployeeName || 'your predecessor'}</p>
        </div>
        <ExportButton title="Export Handover" variant="outline" size="sm" />
      </div>

      {/* Progress Card */}
      <Card className="enterprise-shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Transfer Progress</h3>
                <p className="text-xs text-muted-foreground">
                  {completedTasks.length} of {totalTasks} tasks completed
                </p>
              </div>
            </div>
            <span className="text-3xl font-semibold text-primary">{progressPercentage}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            variant={progressPercentage >= 80 ? 'success' : progressPercentage >= 50 ? 'warning' : 'critical'}
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* KT Approval Request */}
      {readyForApproval && handoverInfo && (
        <Card className={`enterprise-shadow-md ${approvalSent ? 'border-success/30 bg-success/5' : 'border-primary/30 bg-primary/5'}`}>
          <CardContent className="p-5 text-center space-y-3">
            <CheckCheck className="h-8 w-8 text-primary mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {approvalSent ? 'Approval Request Sent' : 'All Tasks Acknowledged!'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {approvalSent 
                  ? 'Your KT approval request has been sent to the manager. You will be notified once approved.'
                  : 'Request manager approval to officially close this handover.'}
              </p>
            </div>
            {!approvalSent && (
              <Button
                onClick={async () => {
                  await createRequest(
                    tasks[0].id,
                    handoverInfo.handoverId,
                    'manager',
                    `All ${totalTasks} tasks have been acknowledged by the successor. Requesting approval to close the handover for ${handoverInfo.exitingEmployeeName}.`
                  );
                  setApprovalSent(true);
                }}
                className="gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Request KT Approval from Manager
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
        <Alert variant="destructive" className="border-critical/20 bg-critical-soft">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium text-sm">Critical Missing Items:</span>
            <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
              {criticalGaps.map((gap, i) => <li key={i}>{gap}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <h3 className="text-sm font-medium text-foreground">Completed ({completedTasks.length})</h3>
          </div>
          <div className="space-y-2">
            {completedTasks.map(task => <TaskCard key={task.id} task={task} variant="completed" />)}
          </div>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-medium text-foreground">Pending ({pendingTasks.length})</h3>
          </div>
          <div className="space-y-2">
            {pendingTasks.map(task => <TaskCard key={task.id} task={task} variant="pending" />)}
          </div>
        </div>
      )}

      {totalTasks === 0 && (
        <Card className="enterprise-shadow">
          <CardContent className="p-12 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No handover tasks assigned yet.</p>
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

      <TaskHelpRequestModal
        isOpen={helpRequestModal.isOpen}
        onClose={() => setHelpRequestModal({ isOpen: false, task: null, type: 'employee' })}
        task={helpRequestModal.task}
        requestType={helpRequestModal.type}
        loading={sendingRequest}
        onSubmit={async (message) => {
          if (!helpRequestModal.task || !handoverInfo) return;
          setSendingRequest(true);
          await createRequest(helpRequestModal.task.id, handoverInfo.handoverId, helpRequestModal.type, message);
          setSendingRequest(false);
        }}
      />

      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold">{selectedTask?.title}</DialogTitle>
                <DialogDescription className="mt-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{selectedTask?.category}</Badge>
                    <Badge variant={selectedTask?.status === 'completed' ? 'default' : 'secondary'} className={`text-[10px] ${selectedTask?.status === 'completed' ? 'bg-success text-success-foreground' : ''}`}>
                      {selectedTask?.status === 'completed' ? 'Completed' : selectedTask?.status}
                    </Badge>
                    {selectedTask?.priority && (
                      <Badge variant={selectedTask.priority === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                        {selectedTask.priority}
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-5">
            {selectedTask?.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overview</h4>
                <div className="bg-muted/30 border rounded-lg p-3">
                  <p className="text-sm text-foreground">{selectedTask.description}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">KT Notes</h4>
              {selectedTask?.notes ? (
                <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
                  <ExpandableText text={selectedTask.notes} maxLines={5} />
                </div>
              ) : (
                <div className="bg-muted/20 border border-dashed rounded-lg p-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No notes added yet.</p>
                </div>
              )}
            </div>

            {selectedTask?.notes && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What This Means For You</h4>
                <div className="bg-success/5 border border-success/15 rounded-lg p-3">
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" /><span>Review and understand the documented knowledge thoroughly</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" /><span>Note any clarifications needed before handover completes</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 flex-shrink-0" /><span>Acknowledge once you've fully understood the knowledge</span></li>
                  </ul>
                </div>
              </div>
            )}

            {selectedTask?.dueDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-warning/5 border border-warning/15 rounded-lg p-2.5">
                <Clock className="h-3.5 w-3.5 text-warning" />
                Due: {new Date(selectedTask.dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </div>

          <div className="border-t pt-3 mt-auto">
            {selectedTask?.successorAcknowledged ? (
              <div className="flex items-center gap-2.5 bg-primary/5 border border-primary/15 rounded-lg p-3">
                <CheckCheck className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">Knowledge Acknowledged</p>
                  {selectedTask.successorAcknowledgedAt && (
                    <p className="text-[11px] text-muted-foreground">
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
                }} disabled={acknowledgingTaskId === selectedTask?.id}>
                  {acknowledgingTaskId === selectedTask?.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5 mr-1.5" />}
                  Acknowledge KT
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
