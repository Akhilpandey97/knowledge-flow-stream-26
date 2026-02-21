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
import { WhatsAppChat } from './WhatsAppChat';
import { AIChatBot, AIFloatingButton } from './AIChatBot';

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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTaskFilter, setChatTaskFilter] = useState<string | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
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
            const pendingQCount = taskRequests.filter(r => r.status === 'pending').length;
            const taskMeetings = getMeetingsForTask(task.id).filter(m => m.ai_summary);

            return (
              <Card key={task.id} className={`enterprise-shadow transition-all hover:enterprise-shadow-md group ${
                task.status === 'completed' ? 'border-l-4 border-l-success' : 
                task.priority === 'critical' ? 'border-l-4 border-l-critical' :
                task.priority === 'high' ? 'border-l-4 border-l-warning' :
                'border-l-4 border-l-border'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Toggle */}
                    <button 
                      onClick={() => handleTaskToggle(task.id)} 
                      className="mt-0.5 flex-shrink-0 transition-all hover:scale-110 active:scale-95"
                    >
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed' 
                          ? 'bg-success border-success' 
                          : 'border-muted-foreground/30 hover:border-primary'
                      }`}>
                        {task.status === 'completed' && <CheckCircle className="h-3.5 w-3.5 text-success-foreground" />}
                      </div>
                    </button>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Header row — compact */}
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-semibold leading-snug ${
                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Question tag on card */}
                          {pendingQCount > 0 && (
                            <Badge 
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-warning/40 text-warning bg-warning/5 cursor-pointer hover:bg-warning/10"
                              onClick={() => { setChatTaskFilter(task.id); setChatOpen(true); }}
                            >
                              <MessageCircle className="h-2.5 w-2.5 mr-0.5" />{pendingQCount}
                            </Badge>
                          )}
                          {taskRequests.length > 0 && pendingQCount === 0 && (
                            <Badge 
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-success/40 text-success bg-success/5 cursor-pointer hover:bg-success/10"
                              onClick={() => { setChatTaskFilter(task.id); setChatOpen(true); }}
                            >
                              <MessageCircle className="h-2.5 w-2.5 mr-0.5" />{taskRequests.length}
                            </Badge>
                          )}
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
                      
                      {/* Meta row — compact */}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="px-1.5 py-0.5 bg-muted/50 rounded font-medium">{task.category}</span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {/* Individual Insight Cards with timestamps */}
                      {task.insights && task.insights.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {task.insights.map((insight) => (
                            <div key={insight.id} className="bg-primary/3 border border-primary/10 rounded-lg p-3 group/insight">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Lightbulb className="h-3 w-3 text-primary flex-shrink-0" />
                                    <span className="text-xs font-semibold text-primary">{insight.topic}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{insight.content}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] text-muted-foreground/70">
                                      {new Date(insight.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {insight.attachments?.length > 0 && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <FileText className="h-2.5 w-2.5" /> {insight.attachments.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/insight:opacity-100" onClick={() => handleEditInsight(task, insight)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes fallback — as card */}
                      {task.notes && (!task.insights || task.insights.length === 0) && (
                        <div className="bg-muted/30 border rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3 text-muted-foreground" /> Notes
                            </span>
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => { setEditingNoteTaskId(task.id); setEditNoteContent(task.notes || ''); }}>
                              <Edit2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                          {editingNoteTaskId === task.id ? (
                            <div className="space-y-2">
                              <Textarea value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} className="min-h-[60px] text-xs" />
                              <div className="flex gap-2">
                                <Button size="sm" className="h-6 text-[10px] px-2" onClick={async () => { await updateTask(task.id, { notes: editNoteContent }); setEditingNoteTaskId(null); }}>
                                  <Save className="h-2.5 w-2.5 mr-1" /> Save
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditingNoteTaskId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.notes}</p>
                          )}
                        </div>
                      )}

                      {/* Meeting summaries — compact */}
                      {taskMeetings.length > 0 && (
                        <div className="space-y-1.5">
                          {taskMeetings.map(meeting => (
                            <div key={meeting.id} className="rounded-lg border border-primary/15 bg-primary/3 p-2.5 flex items-start gap-2">
                              <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold text-foreground">{meeting.title}</span>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{meeting.ai_summary}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions — compact */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 gap-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30" onClick={() => handleTaskClick(task)}>
                          <Plus className="h-3 w-3" /> Add Insights
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 gap-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30" onClick={() => handleRecordVideoClick(task)}>
                          <Video className="h-3 w-3" /> Meetings
                        </Button>
                        {taskRequests.length > 0 && (
                          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 gap-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                            onClick={() => { setChatTaskFilter(task.id); setChatOpen(true); }}>
                            <MessageCircle className="h-3 w-3" /> Chat
                          </Button>
                        )}
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

      {/* WhatsApp-style Chat */}
      <WhatsAppChat
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatTaskFilter(null); }}
        requests={chatTaskFilter 
          ? employeeRequests.filter(r => r.task_id === chatTaskFilter)
          : employeeRequests.filter(r => r.request_type === 'employee')
        }
        onSendMessage={async () => {}}
        onRespond={respondToRequest}
        title="Successor Questions"
        subtitle="Respond to help your successor"
        currentUserRole="employee"
      />

      {/* AI Chatbot */}
      <AIChatBot
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        tasks={tasks}
        userRole="employee"
        contextInfo={{ handoverProgress: progressPercentage }}
      />
      <AIFloatingButton onClick={() => setAiChatOpen(true)} />
    </div>
  );
};
