import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, Target, Plus, Video, Loader2, Edit2, Lightbulb, 
  MessageCircle, Save, X, Send, Sparkles, Clock, AlertTriangle,
  ArrowRight, FileText, TrendingUp, BarChart3, Shield
} from 'lucide-react';
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
  const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length;
  const insightCount = tasks.reduce((sum, t) => sum + (t.insights?.length || 0), 0);
  const pendingRequests = employeeRequests.filter(r => r.status === 'pending').length;

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Loading handover</p>
            <p className="text-xs text-muted-foreground mt-1">Preparing your knowledge transfer workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-sm w-full enterprise-shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-critical/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6 text-critical" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Connection Error</p>
              <p className="text-xs text-muted-foreground mt-1">Unable to load handover data</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry Connection</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary uppercase tracking-widest">Active Transfer</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Knowledge Handover</h1>
            <p className="text-muted-foreground max-w-md">
              Document and transfer your institutional knowledge for a seamless transition.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tasks.length === 0 && (
              <Button onClick={() => createHandoverWithTemplate()} className="gap-2 enterprise-shadow">
                <Plus className="h-4 w-4" /> Initialize Checklist
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Completion', value: `${progressPercentage}%`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/8' },
          { label: 'Tasks Done', value: `${completedTasks}/${totalTasks}`, icon: CheckCircle, color: 'text-success', bg: 'bg-success/8' },
          { label: 'Critical Pending', value: criticalTasks.toString(), icon: AlertTriangle, color: criticalTasks > 0 ? 'text-critical' : 'text-muted-foreground', bg: criticalTasks > 0 ? 'bg-critical/8' : 'bg-muted/50' },
          { label: 'Insights Added', value: insightCount.toString(), icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/8' },
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
        <CardContent className="p-0">
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{progressPercentage}%</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{remainingTasks} tasks remaining to complete handover</p>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
          {allTasksCompleted && totalTasks > 0 && (
            <div className="border-t bg-success/5 p-4">
              <Button onClick={() => alert('🎉 Handover completed successfully!')} className="w-full gap-2 bg-success hover:bg-success/90 text-success-foreground">
                <Shield className="h-4 w-4" /> Finalize & Complete Handover
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Successor Questions */}
      {pendingRequests > 0 && (
        <Card className="border-warning/20 bg-warning/5 enterprise-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-warning/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{pendingRequests} pending question{pendingRequests > 1 ? 's' : ''} from successor</p>
              <p className="text-xs text-muted-foreground">Respond to help your successor understand your knowledge</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Task Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Transfer Checklist</h2>
              <p className="text-xs text-muted-foreground">{totalTasks} items · {completedTasks} completed</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {tasks.map(task => {
            const taskRequests = employeeRequests.filter(r => r.task_id === task.id);
            const isExpanded = expandedHelpTasks[task.id] || false;
            const taskMeetings = getMeetingsForTask(task.id).filter(m => m.ai_summary);

            return (
              <Card key={task.id} className={`enterprise-shadow transition-all hover:enterprise-shadow-md group ${
                task.status === 'completed' ? 'border-l-4 border-l-success' : 
                task.priority === 'critical' ? 'border-l-4 border-l-critical' :
                task.priority === 'high' ? 'border-l-4 border-l-warning' :
                'border-l-4 border-l-border'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Toggle */}
                    <button 
                      onClick={() => handleTaskToggle(task.id)} 
                      className="mt-0.5 flex-shrink-0 transition-all hover:scale-110 active:scale-95"
                    >
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed' 
                          ? 'bg-success border-success' 
                          : 'border-muted-foreground/30 hover:border-primary group-hover:border-primary/50'
                      }`}>
                        {task.status === 'completed' && <CheckCircle className="h-4 w-4 text-success-foreground" />}
                      </div>
                    </button>
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className={`text-sm font-semibold leading-snug ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${
                            task.priority === 'critical' ? 'border-critical/40 text-critical bg-critical/5' :
                            task.priority === 'high' ? 'border-warning/40 text-warning bg-warning/5' :
                            task.priority === 'medium' ? 'border-primary/40 text-primary bg-primary/5' :
                            'border-muted-foreground/20 text-muted-foreground bg-muted/30'
                          }`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="px-2 py-0.5 bg-muted/50 rounded-md font-medium">{task.category}</span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Insights */}
                      {task.insights && task.insights.length > 0 && (
                        <div className="space-y-2 bg-primary/3 border border-primary/10 rounded-xl p-4">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-foreground">Insights ({task.insights.length})</span>
                          </div>
                          {task.insights.map((insight) => (
                            <div key={insight.id} className="bg-card border rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-primary">{insight.topic}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(insight.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <ExpandableText text={insight.content} maxLines={3} className="text-xs text-muted-foreground" />
                                  {insight.attachments?.length > 0 && (
                                    <p className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                                      <FileText className="h-3 w-3" /> {insight.attachments.join(', ')}
                                    </p>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditInsight(task, insight)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes fallback */}
                      {task.notes && (!task.insights || task.insights.length === 0) && (
                        <div className="bg-muted/30 border rounded-xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <FileText className="h-3 w-3 text-muted-foreground" /> Notes
                            </span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { setEditingNoteTaskId(task.id); setEditNoteContent(task.notes || ''); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {editingNoteTaskId === task.id ? (
                            <div className="space-y-2">
                              <Textarea value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} className="min-h-[80px] text-xs" />
                              <div className="flex gap-2">
                                <Button size="sm" className="h-7 text-xs px-3" onClick={async () => { await updateTask(task.id, { notes: editNoteContent }); setEditingNoteTaskId(null); }}>
                                  <Save className="h-3 w-3 mr-1" /> Save
                                </Button>
                                <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => setEditingNoteTaskId(null)}>
                                  Cancel
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
                        if (taskRequests.length === 0) return null;
                        return (
                          <div className="rounded-xl border bg-muted/20 p-3">
                            <button className="flex items-center gap-2 w-full text-left" onClick={() => setExpandedHelpTasks(prev => ({ ...prev, [task.id]: !prev[task.id] }))}>
                              <MessageCircle className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-semibold text-foreground">Successor Questions ({taskRequests.length})</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto">
                                {taskRequests.filter(r => r.status === 'pending').length} pending
                              </Badge>
                            </button>
                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {taskRequests.map(req => (
                                  <div key={req.id} className="text-xs bg-card rounded-lg p-3 border space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-foreground font-medium">{req.message}</p>
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                        {new Date(req.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {req.response && (
                                      <div className="bg-success/5 border border-success/15 rounded-lg p-2">
                                        <p className="text-success text-xs">↳ {req.response}</p>
                                      </div>
                                    )}
                                    {req.status === 'pending' && (
                                      <div className="flex gap-2 pt-1">
                                        <Input
                                          placeholder="Type your reply..."
                                          className="h-8 text-xs flex-1"
                                          value={replyInputs[req.id] || ''}
                                          onChange={(e) => setReplyInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                                        />
                                        <Button size="sm" className="h-8 px-3 text-xs"
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
                        if (taskMeetings.length === 0) return null;
                        return (
                          <div className="space-y-2">
                            {taskMeetings.map(meeting => (
                              <div key={meeting.id} className="rounded-xl border border-primary/15 bg-primary/3 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-xs font-semibold text-foreground">{meeting.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{meeting.ai_summary}</p>
                                {meeting.ai_action_items?.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Action Items</span>
                                    {meeting.ai_action_items.map((item: any, idx: number) => (
                                      <div key={idx} className="text-xs flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">{item.priority}</Badge>
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
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant="outline" size="sm" className="h-8 text-xs px-3 gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30" onClick={() => handleTaskClick(task)}>
                          <Plus className="h-3.5 w-3.5" /> Add Insights
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs px-3 gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30" onClick={() => handleRecordVideoClick(task)}>
                          <Video className="h-3.5 w-3.5" /> Meetings
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
