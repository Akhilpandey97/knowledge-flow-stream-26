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
  Loader2
} from 'lucide-react';
import { HandoverTask } from '@/types/handover';
import { TaskDetailModal } from './TaskDetailModal';
import { ExportButton } from '@/components/ui/export-button';
import { IntegrationsPanel } from '@/components/ui/integrations-panel';
import { useHandover } from '@/hooks/useHandover';
import { useToast } from '@/components/ui/use-toast';

export const ExitingEmployeeDashboard: React.FC = () => {
  const { tasks, loading, error, updateTask } = useHandover();
  const { toast } = useToast();
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
      await updateTask(taskId, { isCompleted: !task.isCompleted });
      toast({
        title: task.isCompleted ? 'Task marked as pending' : 'Task completed',
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

  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const progressPercentage = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading handover data...</span>
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Knowledge Handover</h2>
          <p className="text-muted-foreground">
            Transferring knowledge to your successor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Target completion: <span className="font-medium">Jan 15, 2024</span>
          </span>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Handover Progress
          </CardTitle>
          <CardDescription>
            Track your knowledge transfer completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              variant={progressPercentage >= 80 ? 'success' : progressPercentage >= 50 ? 'warning' : 'critical'}
              className="h-3"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{completedTasks} of {tasks.length} tasks completed</span>
              <span>{tasks.length - completedTasks} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Placeholders */}
      <IntegrationsPanel />

      {/* AI Suggestion Alert */}
      <Alert className="border-primary/20 bg-primary-soft">
        <MessageSquare className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          <strong>AI Suggestion:</strong> Would you like to add meeting notes from your recent client calls? 
          This could help Sarah understand client preferences better.
          <Button variant="soft" size="sm" className="ml-2">
            Add Meeting Notes
          </Button>
          <ExportButton title="Export Progress" variant="outline" size="sm" />
        </AlertDescription>
      </Alert>

      {/* Tasks Checklist */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Knowledge Transfer Checklist</CardTitle>
          <CardDescription>Complete these domain-specific tasks for a smooth handover</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-3 hover:shadow-soft transition-shadow">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={task.isCompleted}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Category: {task.category}
                    </div>
                    
                    {task.notes && (
                      <div className="bg-success-soft p-3 rounded border border-success/20">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium text-success">Notes Added</span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{task.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Notes
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openTaskDetail(task)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-3 h-3 mr-1" />
                        Record Video
                      </Button>
                    </div>

                    {selectedTaskId === task.id && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Add detailed notes about this task..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="min-h-[100px]"
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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