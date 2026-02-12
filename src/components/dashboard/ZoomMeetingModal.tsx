import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, Plus, ExternalLink, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { HandoverTask } from '@/types/handover';
import { useMeetings } from '@/hooks/useMeetings';

interface ZoomMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: HandoverTask | null;
  allTasks: HandoverTask[];
  handoverId?: string;
}

export const ZoomMeetingModal: React.FC<ZoomMeetingModalProps> = ({ 
  isOpen, onClose, task, allTasks, handoverId
}) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'create'>('scheduled');
  const { meetings, loading, createMeeting, generateAISummary } = useMeetings();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [newMeeting, setNewMeeting] = useState({
    taskId: task?.id || '',
    title: task ? `Knowledge Transfer - ${task.title}` : '',
    description: '',
    date: '',
    time: '',
    duration: '45 min',
    attendees: ''
  });

  const filteredMeetings = meetings.filter(m => !task || m.task_id === task.id);

  const handleCreateMeeting = async () => {
    await createMeeting({
      task_id: newMeeting.taskId,
      handover_id: handoverId,
      title: newMeeting.title,
      description: newMeeting.description,
      meeting_date: newMeeting.date,
      meeting_time: newMeeting.time,
      duration: newMeeting.duration,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()).filter(Boolean),
    });
    setNewMeeting({ taskId: '', title: '', description: '', date: '', time: '', duration: '45 min', attendees: '' });
    setActiveTab('scheduled');
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    setGeneratingId(meetingId);
    await generateAISummary(meetingId);
    setGeneratingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
      case 'completed': return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Knowledge Transfer Meetings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button variant={activeTab === 'scheduled' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('scheduled')} className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />Scheduled Meetings
            </Button>
            <Button variant={activeTab === 'create' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab('create')} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />Create Meeting
            </Button>
          </div>

          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {task ? `Meetings for: ${task.title}` : 'Upcoming Knowledge Transfer Sessions'}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('create')}>
                  <Plus className="h-4 w-4 mr-2" />Schedule New
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : (
                <div className="grid gap-4">
                  {filteredMeetings.map((meeting) => (
                    <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base font-medium mb-1">{meeting.title}</CardTitle>
                            {meeting.task_title && <p className="text-sm text-muted-foreground mb-2">Task: {meeting.task_title}</p>}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(meeting.meeting_date).toLocaleDateString()}</div>
                              <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{meeting.meeting_time} ({meeting.duration})</div>
                            </div>
                          </div>
                          {getStatusBadge(meeting.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {meeting.description && <p className="text-sm text-muted-foreground">{meeting.description}</p>}
                        {meeting.attendees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Attendees:</span>
                            <span className="text-sm text-muted-foreground">{meeting.attendees.join(', ')}</span>
                          </div>
                        )}

                        {/* AI Summary */}
                        {meeting.ai_summary && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">AI Meeting Summary</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{meeting.ai_summary}</p>
                          </div>
                        )}

                        {/* AI Action Items */}
                        {meeting.ai_action_items && meeting.ai_action_items.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800">AI Action Items</span>
                            </div>
                            <ul className="space-y-1">
                              {meeting.ai_action_items.map((item: any, idx: number) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <Badge variant="outline" className="text-[10px] mt-0.5 shrink-0">
                                    {item.priority || 'medium'}
                                  </Badge>
                                  <span className="text-muted-foreground">{item.title}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {meeting.meeting_link && meeting.status === 'scheduled' && (
                            <Button variant="outline" size="sm" onClick={() => window.open(meeting.meeting_link!, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />Join Zoom
                            </Button>
                          )}
                          {meeting.status === 'scheduled' && (
                            <Button size="sm" variant="default" disabled={generatingId === meeting.id} onClick={() => handleCompleteMeeting(meeting.id)}>
                              {generatingId === meeting.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                              Complete & Generate AI Summary
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && filteredMeetings.length === 0 && (
                <Card className="text-center py-8">
                  <CardContent>
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {task ? `No meetings scheduled for "${task.title}"` : 'No meetings scheduled yet'}
                    </p>
                    <Button onClick={() => setActiveTab('create')}>Schedule Your First Meeting</Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule New Knowledge Transfer Meeting</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Related Task</Label>
                  <select className="w-full p-2 border border-input rounded-md" value={newMeeting.taskId}
                    onChange={(e) => {
                      const sel = allTasks.find(t => t.id === e.target.value);
                      setNewMeeting(prev => ({ ...prev, taskId: e.target.value, title: sel ? `Knowledge Transfer - ${sel.title}` : '' }));
                    }}>
                    <option value="">Select a task</option>
                    {allTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Meeting Title</Label>
                  <Input value={newMeeting.title} onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))} placeholder="Enter meeting title" />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newMeeting.date} onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={newMeeting.time} onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <select className="w-full p-2 border border-input rounded-md" value={newMeeting.duration}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, duration: e.target.value }))}>
                    <option value="30 min">30 minutes</option>
                    <option value="45 min">45 minutes</option>
                    <option value="60 min">1 hour</option>
                    <option value="90 min">1.5 hours</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Attendees</Label>
                  <Input value={newMeeting.attendees} onChange={(e) => setNewMeeting(prev => ({ ...prev, attendees: e.target.value }))} placeholder="Comma separated names" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={3} value={newMeeting.description} onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))} placeholder="Meeting agenda" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateMeeting} disabled={!newMeeting.taskId || !newMeeting.title || !newMeeting.date || !newMeeting.time} className="flex-1">
                  <Video className="h-4 w-4 mr-2" />Schedule Meeting
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('scheduled')}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
