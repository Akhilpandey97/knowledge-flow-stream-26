import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Video, 
  MessageSquare,
  Plus,
  Target,
  Edit,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { HandoverTask } from '@/types/handover';
import { TaskDetailModal } from './TaskDetailModal';
import { HelpRequestsPanel } from './HelpRequestsPanel';
import { ExportButton } from '@/components/ui/export-button';
import { useHandover } from '@/hooks/useHandover';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useToast } from '@/components/ui/use-toast';
import { DocumentUploadScreen } from './DocumentUploadScreen';

export const ExitingEmployeeDashboard: React.FC = () => {
  const { tasks, loading, error, updateTask, handoverStatus } = useHandover();
  const { requests: employeeRequests, loading: requestsLoading, respondToRequest } = useHelpRequests('employee');
  const { toast } = useToast();
  const [hasUploadedInSession, setHasUploadedInSession] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailModal, setTaskDetailModal] = useState<{ isOpen: boolean; task: HandoverTask | null }>({
    isOpen: false,
    task: null
  });

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await updateTask(taskId, { status: newStatus });
      toast({
        title: task.status === 'completed' ? 'Task marked as pending' : 'Task completed',
        description: `"${task.title}" has been updated.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addNote = async (taskId: string) => {
    if (!newNote.trim()) return;
    
    try {
      await updateTask(taskId, { notes: newNote });
      setNewNote('');
      setSelectedTaskId(null);
      toast({
        title: 'Note added',
        description: 'Your note has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openTaskDetail = (task: HandoverTask) => {
    setTaskDetailModal({ isOpen: true, task });
  };

  const closeTaskDetail = () => {
    setTaskDetailModal({ isOpen: false, task: null });
  };

  const saveTaskNotes = async (taskId: string, notes: string) => {
    try {
      await updateTask(taskId, { notes });
      toast({
        title: 'Notes saved',
        description: 'Task notes have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'secondary';
    }
  };

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const progressPercentage = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Show loading while fetching handover data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading handover data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Always show document upload screen first for exiting employees
  if (!hasUploadedInSession) {
    return (
      <DocumentUploadScreen 
        onUploadComplete={() => setHasUploadedInSession(true)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Clean Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Handover</h1>
          {handoverStatus === 'closed' && (
            <Badge className="text-xs px-2.5 py-0.5 bg-success/15 text-success border-success/30 border">
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> KT Closed
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-lg">
          Complete your knowledge transfer checklist
        </p>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <p className="text-3xl font-bold">{progressPercentage}%</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">{completedTasks} of {tasks.length} completed</p>
              <p className="text-xs text-muted-foreground">{tasks.length - completedTasks} remaining</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Add Meeting Notes
        </Button>
        <ExportButton title="Export Progress" variant="outline" size="sm" />
      </div>

      {/* Help Requests from Successor - Always show */}
      <HelpRequestsPanel
        requests={employeeRequests.filter(r => r.request_type === 'employee')}
        loading={requestsLoading}
        onRespond={respondToRequest}
        title="Questions from Successor"
        description="Your successor has questions about these tasks"
        emptyMessage="No questions from your successor yet. They'll appear here when asked."
        viewerRole="employee"
      />

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card 
            key={task.id} 
            className={`transition-all duration-200 hover:shadow-md ${
              task.status === 'completed' ? 'bg-muted/30' : 'bg-background'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-1 flex-shrink-0"
                />
                
                {/* Task Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Title and Priority */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={`font-semibold text-lg leading-tight ${
                      task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                    }`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={getPriorityColor(task.priority) as any}>
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed">
                    {task.description}
                  </p>

                  {/* Category */}
                  <div className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {task.category}
                  </div>

                  {/* Notes Display — individual notes with timestamps */}
                  {task.notesList && task.notesList.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">Notes ({task.notesList.length})</span>
                      </div>
                      {task.notesList.map((note) => (
                        <div key={note.id} className="bg-success/5 border border-success/20 rounded-lg p-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            {new Date(note.createdAt).toLocaleString([], { 
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Legacy fallback for plain notes string */}
                  {task.notes && (!task.notesList || task.notesList.length === 0) && (
                    <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">Notes</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => openTaskDetail(task)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Details
                    </Button>
                  </div>

                  {/* Note Input */}
                  {selectedTaskId === task.id && (
                    <div className="space-y-3 pt-3 border-t">
                      <Textarea
                        placeholder="Add your notes here..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="min-h-[120px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addNote(task.id)}>
                          Save Notes
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedTaskId(null);
                            setNewNote('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={taskDetailModal.task}
        isOpen={taskDetailModal.isOpen}
        onClose={closeTaskDetail}
        onSave={saveTaskNotes}
      />
    </div>
  );
};