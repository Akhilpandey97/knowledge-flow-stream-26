import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Target, Plus, Video, Loader2, Edit2, Calendar, Lightbulb } from 'lucide-react';
import { DocumentUploadScreen } from './DocumentUploadScreen';
import { InsightCollectionModal } from './InsightCollectionModal';
import { ZoomMeetingModal } from './ZoomMeetingModal';

import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useHandover } from '@/hooks/useHandover';
import { HandoverTask, TaskInsight } from '@/types/handover';

export const StepBasedExitingEmployeeDashboard: React.FC = () => {
  const { hasUploadedDocument, loading: uploadLoading, markDocumentUploaded } = useDocumentUpload();
  const { tasks, loading: handoverLoading, error, updateTask, createHandoverWithTemplate } = useHandover();
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HandoverTask | null>(null);
  const [editingInsight, setEditingInsight] = useState<TaskInsight | null>(null);

  // Create handover with template on first load if no tasks exist
  useEffect(() => {
    if (!handoverLoading && tasks.length === 0 && hasUploadedDocument) {
      console.log('Creating handover with template - tasks:', tasks.length, 'uploaded:', hasUploadedDocument);
      createHandoverWithTemplate();
    }
  }, [handoverLoading, tasks.length, hasUploadedDocument]);

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const remainingTasks = totalTasks - completedTasks;
  const allTasksCompleted = totalTasks > 0 && completedTasks === totalTasks;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleTaskClick = (task: HandoverTask) => {
    setSelectedTask(task);
    setIsInsightModalOpen(true);
  };

  const handleRecordVideoClick = (task: HandoverTask) => {
    setSelectedTask(task);
    setIsZoomModalOpen(true);
  };


  const handleSaveInsights = async (taskId: string, topic: string, insights: string, file?: File) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const existingInsights = task?.insights || [];
      
      const newInsight: TaskInsight = {
        id: editingInsight?.id || crypto.randomUUID(),
        topic,
        content: insights,
        createdAt: editingInsight?.createdAt || new Date().toISOString(),
        attachments: file ? [file.name] : undefined
      };
      
      let updatedInsights: TaskInsight[];
      if (editingInsight) {
        // Update existing insight
        updatedInsights = existingInsights.map(ins => 
          ins.id === editingInsight.id ? newInsight : ins
        );
      } else {
        // Add new insight
        updatedInsights = [...existingInsights, newInsight];
      }
      
      await updateTask(taskId, { 
        status: 'completed',
        insights: updatedInsights,
        notes: `${topic}: ${insights}` // Keep notes for backward compatibility
      });
      
      if (file) {
        console.log('File would be uploaded:', file.name);
      }
      
      setIsInsightModalOpen(false);
      setSelectedTask(null);
      setEditingInsight(null);
    } catch (error) {
      console.error('Error saving insights:', error);
    }
  };

  const handleEditInsight = (task: HandoverTask, insight: TaskInsight) => {
    setSelectedTask(task);
    setEditingInsight(insight);
    setIsInsightModalOpen(true);
  };

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCompleteHandover = () => {
    // In real app, this would trigger handover completion logic
    alert('🎉 Handover completed successfully! All knowledge has been transferred.');
  };

  // Show loading state
  if (uploadLoading || handoverLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show error state
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
  
  // Show document upload screen only for first-time users (who haven't uploaded before)
  if (!hasUploadedDocument) {
    return <DocumentUploadScreen onUploadComplete={markDocumentUploaded} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Knowledge Handover Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Knowledge Handover</h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Transferring knowledge for handover completion
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-5 w-5" />
            <span className="text-sm">Target completion: <span className="font-semibold">Ongoing</span></span>
          </div>
        </div>

        {/* Handover Progress Card */}
        <Card className="mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
              <h3 className="text-lg sm:text-xl font-bold">Handover Progress</h3>
            </div>
            <p className="text-muted-foreground mb-6">Track your knowledge transfer completion</p>
            
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Overall Progress</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{progressPercentage}%</span>
            </div>
            
            <div className="mb-4">
              <Progress value={progressPercentage} className="h-3" />
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{completedTasks} of {totalTasks} tasks completed</span>
              <span>{remainingTasks} remaining</span>
            </div>

            {allTasksCompleted && totalTasks > 0 && (
              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={handleCompleteHandover}
                  className="w-full font-medium py-3"
                  size="lg"
                >
                  🎉 Complete Handover
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Knowledge Transfer Checklist */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-2">Knowledge Transfer Checklist</h3>
            <p className="text-muted-foreground mb-6">Complete these domain-specific tasks for a smooth handover</p>
            
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No tasks available yet</p>
                <Button onClick={() => createHandoverWithTemplate()}>
                  Create Handover Tasks
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <button
                          onClick={() => handleTaskToggle(task.id)}
                          className="transition-colors hover:scale-110 transform transition-transform duration-200"
                        >
                          <CheckCircle className={`h-5 w-5 ${task.status === 'completed' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                        </button>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-muted-foreground text-sm mb-3">{task.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <p className="text-xs text-muted-foreground">Category: {task.category}</p>
                          <div className="flex items-center gap-3">
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Due: <span className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground font-medium">Status: {task.status}</p>
                          </div>
                        </div>
                        
                        {/* Display all insights */}
                        {task.insights && task.insights.length > 0 && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Insights ({task.insights.length})</span>
                            </div>
                            {task.insights.map((insight) => (
                              <div key={insight.id} className="bg-muted/50 border rounded p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-primary">{insight.topic}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(insight.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{insight.content}</div>
                                    {insight.attachments && insight.attachments.length > 0 && (
                                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                        <span>📎 {insight.attachments.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditInsight(task, insight)}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fallback for old notes format */}
                        {task.notes && (!task.insights || task.insights.length === 0) && (
                          <div className="bg-muted/50 border rounded p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Notes Added</span>
                            </div>
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{task.notes}</div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleTaskClick(task)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Insights
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleRecordVideoClick(task)}
                          >
                            <Video className="h-3 w-3 mr-1" />
                            Meetings
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Insight Collection Modal */}
      <InsightCollectionModal
        isOpen={isInsightModalOpen}
        onClose={() => {
          setIsInsightModalOpen(false);
          setEditingInsight(null);
        }}
        task={selectedTask}
        editingInsight={editingInsight}
        onSaveAndNext={handleSaveInsights}
      />

      {/* Zoom Meeting Modal */}
      <ZoomMeetingModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        task={selectedTask}
        allTasks={tasks}
      />

    </div>
  );
};