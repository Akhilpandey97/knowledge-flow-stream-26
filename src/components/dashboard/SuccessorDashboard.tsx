import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  MessageCircle, 
  HelpCircle, 
  Clock, 
  CheckCircle,
  FileText,
  Video,
  User,
  Loader2,
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ExpandableText } from '@/components/ui/expandable-text';
import { SuccessorAIInsights } from './SuccessorAIInsights';
import { TaskHelpRequestModal } from './TaskHelpRequestModal';
import { TaskAISummaryModal } from './TaskAISummaryModal';
import { HelpRequestsPanel } from './HelpRequestsPanel';
import { useHandover } from '@/hooks/useHandover';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useAuth } from '@/contexts/AuthContext';
import { HandoverTask } from '@/types/handover';
import { supabase } from '@/integrations/supabase/client';

export const SuccessorDashboard: React.FC = () => {
  const { tasks, loading, error, acknowledgeTask } = useHandover();
  const { user } = useAuth();
  const { requests: helpRequests, loading: helpLoading, createRequest, resolveRequest } = useHelpRequests('successor');
  const [notesModal, setNotesModal] = useState(false);
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

  // Fetch handover info including exiting employee details
  useEffect(() => {
    const fetchHandoverInfo = async () => {
      if (!user) return;
      
      try {
        const { data: handovers, error: handoverError } = await supabase
          .from('handovers')
          .select(`
            id,
            employee_id,
            users!handovers_employee_id_fkey (
              email,
              department
            )
          `)
          .eq('successor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (handoverError) {
          console.error('Error fetching handover info:', handoverError);
          return;
        }

        if (handovers && handovers.length > 0) {
          const handover = handovers[0];
          const employeeData = handover.users as any;
          setHandoverInfo({
            handoverId: handover.id,
            exitingEmployeeName: employeeData?.email?.split('@')[0] || 'Predecessor',
            department: employeeData?.department || 'General'
          });
        }
      } catch (err) {
        console.error('Error fetching handover info:', err);
      }
    };

    fetchHandoverInfo();
  }, [user]);

  // Calculate metrics from real data
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round(completedTasks.length / totalTasks * 100) : 0;

  // Check if all completed tasks are acknowledged
  const allAcknowledged = completedTasks.length > 0 && completedTasks.every(t => t.successorAcknowledged);
  const allTasksDone = totalTasks > 0 && completedTasks.length === totalTasks;
  const readyForApproval = allTasksDone && allAcknowledged;

  // Mock critical gaps - in real app, this would be calculated from AI analysis
  const criticalGaps = pendingTasks
    .filter(task => task.priority === 'critical')
    .slice(0, 3)
    .map(task => task.title);

  const daysUntilTarget = 10;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading handover data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading handover data</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Incoming Handover</h2>
          <p className="text-muted-foreground">
            Knowledge transfer from your predecessor
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-muted-foreground">
            <span className="font-medium text-warning">{daysUntilTarget} days</span> remaining
          </span>
          <ExportButton title="Export Handover" variant="outline" size="sm" />
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Handover Progress
          </CardTitle>
          <CardDescription>Track the knowledge transfer progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transfer Progress</span>
              <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              variant={progressPercentage >= 80 ? 'success' : progressPercentage >= 50 ? 'warning' : 'critical'}
              className="h-3"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{completedTasks.length}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{pendingTasks.length}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KT Approval Request */}
      {readyForApproval && handoverInfo && (
        <Card className="border-primary/30 bg-primary/5 shadow-medium">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCheck className="h-10 w-10 text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-foreground">All Tasks Acknowledged!</h3>
              <p className="text-sm text-muted-foreground">You've acknowledged all knowledge transfer items. Request manager approval to close this handover.</p>
            </div>
            <Button
              onClick={async () => {
                // Create a manager help request to approve KT
                await createRequest(
                  tasks[0].id,
                  handoverInfo.handoverId,
                  'manager',
                  `All ${totalTasks} tasks have been acknowledged by the successor. Requesting approval to close the handover for ${handoverInfo.exitingEmployeeName}.`
                );
              }}
              className="gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Request KT Approval from Manager
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Knowledge Transfer Insights */}
      <SuccessorAIInsights 
        handoverId={handoverInfo?.handoverId}
        tasks={tasks}
        exitingEmployeeName={handoverInfo?.exitingEmployeeName}
        department={handoverInfo?.department}
      />

      {/* Critical Missing Items Alert */}
      {criticalGaps.length > 0 && (
        <Alert variant="destructive" className="border-critical/20 bg-critical-soft">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Critical Missing Items Identified:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {criticalGaps.map((gap, index) => (
                  <li key={index}>{gap}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help requests are now shown inline within each task card */}

      {/* Completed Tasks */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Completed Handover Items
          </CardTitle>
          <CardDescription>Knowledge that has been successfully transferred</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed tasks yet</p>
            ) : (
              completedTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 bg-success-soft border-success/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-success">{task.title}</h4>
                    <div className="flex items-center gap-2">
                      {task.successorAcknowledged && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          <CheckCheck className="w-3 h-3 mr-1" />
                          Acknowledged
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs border-success text-success">
                        Completed
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Category: {task.category}</p>
                  {/* Task-specific Help Requests */}
                  {(() => {
                    const taskReqs = helpRequests.filter(r => r.task_id === task.id);
                    if (taskReqs.length === 0) return null;
                    return (
                      <div className="bg-primary/5 border border-primary/20 rounded p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">Help Requests ({taskReqs.length})</span>
                        </div>
                        {taskReqs.map(req => (
                          <div key={req.id} className="text-xs border-b last:border-b-0 py-1.5 space-y-1">
                            <p className="text-foreground">{req.message}</p>
                            {req.response && <p className="text-success italic">↳ {req.response}</p>}
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{req.status}</Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => setAiSummaryModal({ isOpen: true, task })}
                      className="gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Insights
                    </Button>
                    {task.notes && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setNotesModal(true);
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View Notes
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHelpRequestModal({ isOpen: true, task, type: 'employee' })}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Ask Employee
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHelpRequestModal({ isOpen: true, task, type: 'manager' })}
                      className="text-warning hover:text-warning hover:bg-warning/10"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      Request Help
                    </Button>
                    {!task.successorAcknowledged && (
                      <Button 
                        variant="default" 
                        size="sm"
                        disabled={acknowledgingTaskId === task.id}
                        onClick={async () => {
                          setAcknowledgingTaskId(task.id);
                          await acknowledgeTask(task.id);
                          setAcknowledgingTaskId(null);
                        }}
                      >
                        {acknowledgingTaskId === task.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3 h-3 mr-1" />
                        )}
                        Acknowledge KT
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Handover Items
          </CardTitle>
          <CardDescription>Items still being prepared by your predecessor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">All tasks completed!</p>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 border-warning/20 bg-warning-soft">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={task.priority === 'critical' ? 'destructive' : 'secondary'} 
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Category: {task.category}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                  {/* Task-specific Help Requests */}
                  {(() => {
                    const taskReqs = helpRequests.filter(r => r.task_id === task.id);
                    if (taskReqs.length === 0) return null;
                    return (
                      <div className="bg-primary/5 border border-primary/20 rounded p-3 mb-3 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">Help Requests ({taskReqs.length})</span>
                        </div>
                        {taskReqs.map(req => (
                          <div key={req.id} className="text-xs border-b last:border-b-0 py-1.5 space-y-1">
                            <p className="text-foreground">{req.message}</p>
                            {req.response && <p className="text-success italic">↳ {req.response}</p>}
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{req.status}</Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHelpRequestModal({ isOpen: true, task, type: 'employee' })}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Ask Employee
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHelpRequestModal({ isOpen: true, task, type: 'manager' })}
                      className="text-warning hover:text-warning hover:bg-warning/10"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      Request Help
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task AI Summary Modal */}
      <TaskAISummaryModal
        isOpen={aiSummaryModal.isOpen}
        onClose={() => setAiSummaryModal({ isOpen: false, task: null })}
        task={aiSummaryModal.task}
        exitingEmployeeName={handoverInfo?.exitingEmployeeName}
      />

      {/* Task Help Request Modal */}
      <TaskHelpRequestModal
        isOpen={helpRequestModal.isOpen}
        onClose={() => setHelpRequestModal({ isOpen: false, task: null, type: 'employee' })}
        task={helpRequestModal.task}
        requestType={helpRequestModal.type}
        loading={sendingRequest}
        onSubmit={async (message) => {
          if (!helpRequestModal.task || !handoverInfo) return;
          setSendingRequest(true);
          await createRequest(
            helpRequestModal.task.id,
            handoverInfo.handoverId,
            helpRequestModal.type,
            message
          );
          setSendingRequest(false);
        }}
      />

      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-foreground">
                  {selectedTask?.title}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTask?.category || 'General'}
                    </Badge>
                    <Badge 
                      variant={selectedTask?.status === 'completed' ? 'default' : 'secondary'}
                      className={`text-xs ${selectedTask?.status === 'completed' ? 'bg-success text-white' : ''}`}
                    >
                      {selectedTask?.status === 'completed' ? 'Completed' : selectedTask?.status}
                    </Badge>
                    {selectedTask?.priority && (
                      <Badge 
                        variant={selectedTask.priority === 'critical' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {selectedTask.priority} priority
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Task Description */}
            {selectedTask?.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Task Overview
                </h4>
                <div className="bg-muted/50 border border-border rounded-xl p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedTask.description}
                  </p>
                </div>
              </div>
            )}

            {/* Knowledge Transfer Notes */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Knowledge Transfer Notes
              </h4>
              {selectedTask?.notes ? (
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-5">
                  <div className="prose prose-sm max-w-none">
                    <ExpandableText text={selectedTask.notes} maxLines={5} />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No detailed notes have been added yet.
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    The predecessor may still be preparing documentation.
                  </p>
                </div>
              )}
            </div>

            {/* Key Insights for Successor */}
            {selectedTask?.notes && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <User className="h-4 w-4" />
                  What This Means For You
                </h4>
                <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Review and understand the documented knowledge thoroughly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Note any questions or clarifications needed before handover completes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>Acknowledge once you've fully understood the transferred knowledge</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Due Date if available */}
            {selectedTask?.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-warning/5 border border-warning/20 rounded-lg p-3">
                <Clock className="h-4 w-4 text-warning" />
                <span>Due: {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}
          </div>

          {/* Footer with acknowledgment status */}
          <div className="border-t pt-4 mt-auto">
            {selectedTask?.successorAcknowledged && selectedTask.successorAcknowledgedAt ? (
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
                <CheckCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Knowledge Acknowledged</p>
                  <p className="text-xs text-muted-foreground">
                    You confirmed understanding on {new Date(selectedTask.successorAcknowledgedAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Review the notes above and acknowledge when ready
                </p>
                <Button 
                  onClick={async () => {
                    if (selectedTask) {
                      setAcknowledgingTaskId(selectedTask.id);
                      await acknowledgeTask(selectedTask.id);
                      setAcknowledgingTaskId(null);
                      setNotesModal(false);
                    }
                  }}
                  disabled={acknowledgingTaskId === selectedTask?.id}
                >
                  {acknowledgingTaskId === selectedTask?.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4 mr-2" />
                  )}
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