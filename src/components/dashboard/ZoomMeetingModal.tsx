import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, Plus, Edit2, ExternalLink } from 'lucide-react';
import { HandoverTask } from '@/types/handover';

interface Meeting {
  id: string;
  taskId: string;
  taskTitle: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  attendees: string[];
  zoomLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface ZoomMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: HandoverTask | null;
  allTasks: HandoverTask[];
}

export const ZoomMeetingModal: React.FC<ZoomMeetingModalProps> = ({ 
  isOpen, 
  onClose, 
  task,
  allTasks 
}) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'create'>('scheduled');
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Mock meetings data - in real app, fetch from database
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      taskId: '1',
      taskTitle: 'Client Account Handover - TechCorp',
      title: 'TechCorp Account Transition Meeting',
      description: 'Detailed discussion about TechCorp account handover process and client requirements',
      date: '2024-01-15',
      time: '10:00',
      duration: '45 min',
      attendees: ['Sarah Wilson', 'John Doe'],
      zoomLink: 'https://zoom.us/j/123456789',
      status: 'scheduled'
    },
    {
      id: '2',
      taskId: '2',
      taskTitle: 'Project Documentation - Mobile App',
      title: 'Mobile App Project Status Review',
      description: 'Review current project status, milestones, and next steps for mobile app development',
      date: '2024-01-16',
      time: '14:00',
      duration: '60 min',
      attendees: ['Sarah Wilson', 'Mike Johnson'],
      zoomLink: 'https://zoom.us/j/987654321',
      status: 'scheduled'
    }
  ]);

  const [newMeeting, setNewMeeting] = useState({
    taskId: task?.id || '',
    title: task ? `Knowledge Transfer - ${task.title}` : '',
    description: '',
    date: '',
    time: '',
    duration: '45 min',
    attendees: 'Sarah Wilson'
  });

  const handleCreateMeeting = () => {
    const taskTitle = allTasks.find(t => t.id === newMeeting.taskId)?.title || '';
    const meeting: Meeting = {
      id: Date.now().toString(),
      taskId: newMeeting.taskId,
      taskTitle,
      title: newMeeting.title,
      description: newMeeting.description,
      date: newMeeting.date,
      time: newMeeting.time,
      duration: newMeeting.duration,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()),
      zoomLink: `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`,
      status: 'scheduled'
    };

    setMeetings(prev => [...prev, meeting]);
    setNewMeeting({
      taskId: '',
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '45 min',
      attendees: 'Sarah Wilson'
    });
    setActiveTab('scheduled');
  };

  const handleJoinMeeting = (zoomLink: string) => {
    window.open(zoomLink, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'scheduled' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('scheduled')}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Scheduled Meetings
            </Button>
            <Button
              variant={activeTab === 'create' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('create')}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Meeting
            </Button>
          </div>

          {/* Scheduled Meetings Tab */}
          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {task ? `Meetings for: ${task.title}` : 'Upcoming Knowledge Transfer Sessions'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New
                </Button>
              </div>

              <div className="grid gap-4">
                {meetings.filter(meeting => !task || meeting.taskId === task.id).map((meeting) => (
                  <Card key={meeting.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-medium mb-1">
                            {meeting.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mb-2">
                            Task: {meeting.taskTitle}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(meeting.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {meeting.time} ({meeting.duration})
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(meeting.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMeeting(meeting)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        {meeting.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Attendees:</span>
                          <span className="text-sm text-muted-foreground">
                            {meeting.attendees.join(', ')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJoinMeeting(meeting.zoomLink!)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Join Zoom
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {meetings.filter(meeting => !task || meeting.taskId === task.id).length === 0 && (
                <Card className="text-center py-8">
                  <CardContent>
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {task ? `No meetings scheduled for "${task.title}"` : 'No meetings scheduled yet'}
                    </p>
                    <Button onClick={() => setActiveTab('create')}>
                      Schedule Your First Meeting
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Create Meeting Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Schedule New Knowledge Transfer Meeting</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-select">Related Task</Label>
                  <select
                    id="task-select"
                    className="w-full p-2 border border-input rounded-md"
                    value={newMeeting.taskId}
                    onChange={(e) => {
                      const selectedTask = allTasks.find(t => t.id === e.target.value);
                      setNewMeeting(prev => ({
                        ...prev,
                        taskId: e.target.value,
                        title: selectedTask ? `Knowledge Transfer - ${selectedTask.title}` : ''
                      }));
                    }}
                  >
                    <option value="">Select a task</option>
                    {allTasks.map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-title">Meeting Title</Label>
                  <Input
                    id="meeting-title"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter meeting title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-date">Date</Label>
                  <Input
                    id="meeting-date"
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-time">Time</Label>
                  <Input
                    id="meeting-time"
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-duration">Duration</Label>
                  <select
                    id="meeting-duration"
                    className="w-full p-2 border border-input rounded-md"
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, duration: e.target.value }))}
                  >
                    <option value="30 min">30 minutes</option>
                    <option value="45 min">45 minutes</option>
                    <option value="60 min">1 hour</option>
                    <option value="90 min">1.5 hours</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meeting-attendees">Attendees</Label>
                  <Input
                    id="meeting-attendees"
                    value={newMeeting.attendees}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, attendees: e.target.value }))}
                    placeholder="Enter attendee names (comma separated)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting-description">Meeting Description</Label>
                <Textarea
                  id="meeting-description"
                  rows={3}
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what will be covered in this knowledge transfer session"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleCreateMeeting}
                  disabled={!newMeeting.taskId || !newMeeting.title || !newMeeting.date || !newMeeting.time}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Schedule Zoom Meeting
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('scheduled')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};