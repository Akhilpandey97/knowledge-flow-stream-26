import React, { useState } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { ChatModal } from './ChatModal';
import { EscalationModal } from './EscalationModal';
import { ExportButton } from '@/components/ui/export-button';
import { SuccessorAIInsights } from './SuccessorAIInsights';
import { useHandover } from '@/hooks/useHandover';
import { useAuth } from '@/contexts/AuthContext';
import { HandoverTask } from '@/types/handover';

export const SuccessorDashboard: React.FC = () => {
  const { tasks, loading, error, acknowledgeTask } = useHandover();
  const { user } = useAuth();
  const [chatModal, setChatModal] = useState(false);
  const [escalationModal, setEscalationModal] = useState(false);
  const [notesModal, setNotesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HandoverTask | null>(null);
  const [acknowledgingTaskId, setAcknowledgingTaskId] = useState<string | null>(null);

  // Calculate metrics from real data
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round(completedTasks.length / totalTasks * 100) : 0;

  // Mock critical gaps - in real app, this would be calculated from AI analysis
  const criticalGaps = pendingTasks
    .filter(task => task.priority === 'critical')
    .slice(0, 3)
    .map(task => task.title);

  const daysUntilTarget = 10; // Mock value, in real app calculate from handover data

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

      {/* AI Knowledge Transfer Insights */}
      <SuccessorAIInsights />

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

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="shadow-medium hover:shadow-large transition-shadow cursor-pointer group"
          onClick={() => setChatModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-soft rounded-lg group-hover:bg-primary-muted transition-colors">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Ask Employee</h3>
                <p className="text-sm text-muted-foreground">Send questions or request clarification</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow-medium hover:shadow-large transition-shadow cursor-pointer group"
          onClick={() => setEscalationModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning-soft rounded-lg group-hover:bg-warning/20 transition-colors">
                <HelpCircle className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Request Manager Help</h3>
                <p className="text-sm text-muted-foreground">Escalate concerns or get additional support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <p className="text-sm text-muted-foreground mb-3">Category: {task.category}</p>
                  <div className="flex flex-wrap gap-2">
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModal}
        onClose={() => setChatModal(false)}
        exitingEmployeeName="Predecessor"
      />

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={escalationModal}
        onClose={() => setEscalationModal(false)}
      />

      {/* Notes Modal */}
      <Dialog open={notesModal} onOpenChange={setNotesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Task Notes
            </DialogTitle>
            <DialogDescription>
              Notes for: {selectedTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.notes ? (
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {selectedTask.notes}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No notes available for this task.</p>
            )}
            {selectedTask?.successorAcknowledged && selectedTask.successorAcknowledgedAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCheck className="h-3 w-3 text-primary" />
                Acknowledged on {new Date(selectedTask.successorAcknowledgedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};