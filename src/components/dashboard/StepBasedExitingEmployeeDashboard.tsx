import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Target, Plus, Video, Loader2, Edit2, Lightbulb, MessageCircle, Save, X, Send, Sparkles } from 'lucide-react';
import { InsightCollectionModal } from './InsightCollectionModal';
import { ZoomMeetingModal } from './ZoomMeetingModal';
import { ExpandableText } from '@/components/ui/expandable-text';

import { useHandover } from '@/hooks/useHandover';
import { useHelpRequests } from '@/hooks/useHelpRequests';
import { useMeetings } from '@/hooks/useMeetings';
import { HandoverTask, TaskInsight } from '@/types/handover';

export const StepBasedExitingEmployeeDashboard: React.FC = () => {
  const { tasks, loading: handoverLoading, error, updateTask, createHandoverWithTemplate, handoverId } = useHandover();
  const { requests: employeeRequests, loading: requestsLoading, respondToRequest } = useHelpRequests('employee');
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HandoverTask | null>(null);
  const [editingInsight, setEditingInsight] = useState<TaskInsight | null>(null);
  const [editingNoteTaskId, setEditingNoteTaskId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [expandedHelpTasks, setExpandedHelpTasks] = useState<Record<string, boolean>>({});
  const { getMeetingsForTask } = useMeetings();

  useEffect(() => {
    if (!handoverLoading && tasks.length === 0) {
      createHandoverWithTemplate();
    }
  }, [handoverLoading, tasks.length]);

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const remainingTasks = totalTasks - completedTasks;
  const allTasksCompleted = totalTasks > 0 && completedTasks === totalTasks;

  const handleTaskClick = (task: HandoverTask) => { setSelectedTask(task); setIsInsightModalOpen(true); };
  const handleRecordVideoClick = (task: HandoverTask) => { setSelectedTask(task); setIsZoomModalOpen(true); };

  const handleSaveInsights = async (taskId: string, topic: string, insights: string, file?: File) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const existingInsights = task?.insights || [];
      const newInsight: TaskInsight = {
        id: editingInsight?.id || crypto.randomUUID(), topic, content: insights,
        createdAt: editingInsight?.createdAt || new Date().toISOString(),
        attachments: file ? [file.name] : undefined
      };
      let updatedInsights: TaskInsight[];
      if (editingInsight) {
        updatedInsights = existingInsights.map(ins => ins.id === editingInsight.id ? newInsight : ins);
      } else {
        updatedInsights = [...existingInsights, newInsight];
      }
      await updateTask(taskId, { status: 'completed', insights: updatedInsights, notes: `${topic}: ${insights}` });
      if (file) console.log('File would be uploaded:', file.name);
      setIsInsightModalOpen(false); setSelectedTask(null); setEditingInsight(null);
    } catch (error) { console.error('Error saving insights:', error); }
  };

  const handleEditInsight = (task: HandoverTask, insight: TaskInsight) => {
    setSelectedTask(task); setEditingInsight(insight); setIsInsightModalOpen(true);
  };

  const handleTaskToggle = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try { await updateTask(taskId, { status: newStatus }); } catch (error) { console.error('Error updating task:', error); }
  };

  if (handoverLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Knowledge Handover</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Transfer your knowledge for a smooth transition</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Target className="h-4 w-4" />
          <span>Target: <span className="font-medium text-foreground">Ongoing</span></span>
        </div>
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
                <h3 className="text-sm font-medium text-foreground">Handover Progress</h3>
                <p className="text-xs text-muted-foreground">{completedTasks} of {totalTasks} tasks · {remainingTasks} remaining</p>
              </div>
            </div>
            <span className="text-3xl font-semibold text-primary">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          {allTasksCompleted && totalTasks > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button onClick={() => alert('🎉 Handover completed successfully!')} className="w-full h-9 text-sm">
                🎉 Complete Handover
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Knowledge Transfer Checklist</h3>
          {tasks.length === 0 && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => createHandoverWithTemplate()}>
              <Plus className="h-3 w-3 mr-1" /> Create Tasks
            </Button>
          )}
        </div>
        
        <div className="space-y-2">
          {tasks.map(task => (
            <Card key={task.id} className="enterprise-shadow transition-all hover:enterprise-shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Toggle */}
                  <button onClick={() => handleTaskToggle(task.id)} className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110">
                    <CheckCircle className={`h-5 w-5 ${task.status === 'completed' ? 'text-primary' : 'text-muted-foreground/40 hover:text-primary/60'}`} />
                  </button>
                  
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h4>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                        task.priority === 'critical' ? 'border-critical/30 text-critical bg-critical/5' :
                        task.priority === 'high' ? 'border-warning/30 text-warning bg-warning/5' :
                        task.priority === 'medium' ? 'border-primary/30 text-primary bg-primary/5' :
                        'border-success/30 text-success bg-success/5'
                      }`}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                    
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{task.category}</span>
                      <div className="flex items-center gap-3">
                        {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{task.status}</Badge>
                      </div>
                    </div>
                    
                    {/* Insights */}
                    {task.insights && task.insights.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Lightbulb className="h-3 w-3 text-primary" />
                          <span className="text-[11px] font-medium">Insights ({task.insights.length})</span>
                        </div>
                        {task.insights.map((insight) => (
                          <div key={insight.id} className="bg-muted/30 border rounded-lg p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-medium text-primary">{insight.topic}</span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(insight.createdAt).toLocaleDateString()}</span>
                                </div>
                                <ExpandableText text={insight.content} maxLines={3} className="text-xs text-muted-foreground" />
                                {insight.attachments?.length > 0 && (
                                  <p className="mt-1 text-[10px] text-muted-foreground">📎 {insight.attachments.join(', ')}</p>
                                )}
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEditInsight(task, insight)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Notes fallback */}
                    {task.notes && (!task.insights || task.insights.length === 0) && (
                      <div className="bg-muted/30 border rounded-lg p-2.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-medium">Notes</span>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => { setEditingNoteTaskId(task.id); setEditNoteContent(task.notes || ''); }}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {editingNoteTaskId === task.id ? (
                          <div className="space-y-1.5">
                            <Textarea value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} className="min-h-[60px] text-xs" />
                            <div className="flex gap-1.5">
                              <Button size="sm" className="h-6 text-[10px] px-2" onClick={async () => { await updateTask(task.id, { notes: editNoteContent }); setEditingNoteTaskId(null); }}>
                                <Save className="h-2.5 w-2.5 mr-1" />Save
                              </Button>
                              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditingNoteTaskId(null)}>
                                <X className="h-2.5 w-2.5 mr-1" />Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ExpandableText text={task.notes} maxLines={3} className="text-xs text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Help Requests */}
                    {(() => {
                      const taskRequests = employeeRequests.filter(r => r.task_id === task.id);
                      if (taskRequests.length === 0) return null;
                      const isExpanded = expandedHelpTasks[task.id] || false;
                      return (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                          <button className="flex items-center gap-2 w-full text-left" onClick={() => setExpandedHelpTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}>
                            <MessageCircle className="h-3 w-3 text-primary" />
                            <span className="text-[11px] font-medium">Help Requests ({taskRequests.length})</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5">
                              {taskRequests.map(req => (
                                <div key={req.id} className="text-xs bg-card rounded p-2 border border-border/40 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-foreground">{req.message}</p>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                      {new Date(req.created_at).toLocaleDateString()} {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  {req.response && (
                                    <div className="flex items-center justify-between">
                                      <p className="text-success">↳ {req.response}</p>
                                      {req.responded_at && (
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                          {new Date(req.responded_at).toLocaleDateString()} {new Date(req.responded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">{req.status}</Badge>
                                  {req.status === 'pending' && (
                                    <div className="flex gap-1 mt-1">
                                      <Input
                                        placeholder="Type your reply..."
                                        className="h-7 text-xs flex-1"
                                        value={replyInputs[req.id] || ''}
                                        onChange={(e) => setReplyInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                                      />
                                      <Button size="sm" className="h-7 px-2 text-xs"
                                        disabled={!replyInputs[req.id]?.trim() || replyingId === req.id}
                                        onClick={async () => {
                                          setReplyingId(req.id);
                                          await respondToRequest(req.id, replyInputs[req.id]);
                                          setReplyInputs(prev => { const n = { ...prev }; delete n[req.id]; return n; });
                                          setReplyingId(null);
                                        }}>
                                        {replyingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Meeting Summaries */}
                    {(() => {
                      const taskMeetings = getMeetingsForTask(task.id).filter(m => m.ai_summary);
                      if (taskMeetings.length === 0) return null;
                      return (
                        <div className="space-y-1.5">
                          {taskMeetings.map(meeting => (
                            <div key={meeting.id} className="rounded-lg border border-primary/15 bg-primary/5 p-2.5 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span className="text-[11px] font-medium">{meeting.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{meeting.ai_summary}</p>
                              {meeting.ai_action_items?.length > 0 && (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-medium">Action Items:</span>
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
                      );
                    })()}
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleTaskClick(task)}>
                        <Plus className="h-3 w-3 mr-1" /> Add Insights
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleRecordVideoClick(task)}>
                        <Video className="h-3 w-3 mr-1" /> Meetings
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modals */}
      <InsightCollectionModal
        isOpen={isInsightModalOpen}
        onClose={() => { setIsInsightModalOpen(false); setEditingInsight(null); }}
        task={selectedTask}
        editingInsight={editingInsight}
        onSaveAndNext={handleSaveInsights}
      />
      <ZoomMeetingModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        task={selectedTask}
        allTasks={tasks}
        handoverId={handoverId || undefined}
      />
    </div>
  );
};
