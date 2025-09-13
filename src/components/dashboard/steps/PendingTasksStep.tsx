import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ClipboardList, Calendar, AlertTriangle } from 'lucide-react';
import { PendingTasksData } from '@/types/handover';

interface PendingTasksStepProps {
  onComplete: () => void;
}

export const PendingTasksStep: React.FC<PendingTasksStepProps> = ({ onComplete }) => {
  const [data, setData] = useState<PendingTasksData>({
    urgentTasks: [
      {
        taskName: '',
        priority: 'medium',
        deadline: '',
        assignedTo: '',
        description: ''
      }
    ],
    projectStatus: [
      {
        projectName: '',
        status: '',
        nextSteps: '',
        stakeholders: '',
        notes: ''
      }
    ],
    followUpRequired: '',
    criticalDeadlines: ''
  });

  const addUrgentTask = () => {
    setData(prev => ({
      ...prev,
      urgentTasks: [
        ...prev.urgentTasks,
        {
          taskName: '',
          priority: 'medium',
          deadline: '',
          assignedTo: '',
          description: ''
        }
      ]
    }));
  };

  const removeUrgentTask = (index: number) => {
    setData(prev => ({
      ...prev,
      urgentTasks: prev.urgentTasks.filter((_, i) => i !== index)
    }));
  };

  const updateUrgentTask = (index: number, field: keyof PendingTasksData['urgentTasks'][0], value: string) => {
    setData(prev => ({
      ...prev,
      urgentTasks: prev.urgentTasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const addProject = () => {
    setData(prev => ({
      ...prev,
      projectStatus: [
        ...prev.projectStatus,
        {
          projectName: '',
          status: '',
          nextSteps: '',
          stakeholders: '',
          notes: ''
        }
      ]
    }));
  };

  const removeProject = (index: number) => {
    setData(prev => ({
      ...prev,
      projectStatus: prev.projectStatus.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: keyof PendingTasksData['projectStatus'][0], value: string) => {
    setData(prev => ({
      ...prev,
      projectStatus: prev.projectStatus.map((project, i) => 
        i === index ? { ...project, [field]: value } : project
      )
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSave = () => {
    // Here you would typically save to backend
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Urgent Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Urgent Tasks & Immediate Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.urgentTasks.map((task, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Task #{index + 1}</h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority} priority
                    </Badge>
                  </div>
                  {data.urgentTasks.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeUrgentTask(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`task-name-${index}`}>Task Name</Label>
                    <Input
                      id={`task-name-${index}`}
                      value={task.taskName}
                      onChange={(e) => updateUrgentTask(index, 'taskName', e.target.value)}
                      placeholder="Brief task description"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`priority-${index}`}>Priority Level</Label>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => updateUrgentTask(index, 'priority', value as 'high' | 'medium' | 'low')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`deadline-${index}`}>Deadline</Label>
                    <Input
                      id={`deadline-${index}`}
                      type="date"
                      value={task.deadline}
                      onChange={(e) => updateUrgentTask(index, 'deadline', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`assigned-to-${index}`}>Assigned To</Label>
                    <Input
                      id={`assigned-to-${index}`}
                      value={task.assignedTo}
                      onChange={(e) => updateUrgentTask(index, 'assignedTo', e.target.value)}
                      placeholder="Who should handle this?"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`task-description-${index}`}>Detailed Description</Label>
                  <Textarea
                    id={`task-description-${index}`}
                    value={task.description}
                    onChange={(e) => updateUrgentTask(index, 'description', e.target.value)}
                    placeholder="Provide detailed instructions, context, and any relevant information"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addUrgentTask} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Urgent Task
          </Button>
        </CardContent>
      </Card>

      {/* Project Status Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Project Status & Ongoing Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.projectStatus.map((project, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Project #{index + 1}</h4>
                  {data.projectStatus.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProject(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`project-name-${index}`}>Project Name</Label>
                    <Input
                      id={`project-name-${index}`}
                      value={project.projectName}
                      onChange={(e) => updateProject(index, 'projectName', e.target.value)}
                      placeholder="Project or initiative name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`project-status-${index}`}>Current Status</Label>
                    <Input
                      id={`project-status-${index}`}
                      value={project.status}
                      onChange={(e) => updateProject(index, 'status', e.target.value)}
                      placeholder="e.g., In Progress, On Hold, Near Completion"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`next-steps-${index}`}>Next Steps</Label>
                    <Textarea
                      id={`next-steps-${index}`}
                      value={project.nextSteps}
                      onChange={(e) => updateProject(index, 'nextSteps', e.target.value)}
                      placeholder="What needs to happen next? What are the immediate actions required?"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`project-stakeholders-${index}`}>Key Stakeholders</Label>
                    <Textarea
                      id={`project-stakeholders-${index}`}
                      value={project.stakeholders}
                      onChange={(e) => updateProject(index, 'stakeholders', e.target.value)}
                      placeholder="Who are the key people involved? Who needs to be kept informed?"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`project-notes-${index}`}>Additional Notes</Label>
                    <Textarea
                      id={`project-notes-${index}`}
                      value={project.notes}
                      onChange={(e) => updateProject(index, 'notes', e.target.value)}
                      placeholder="Important context, challenges, or considerations"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addProject} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Project
          </Button>
        </CardContent>
      </Card>

      {/* Follow-up Required Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Follow-up Actions Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="follow-up">Follow-up Actions & Communications</Label>
            <Textarea
              id="follow-up"
              value={data.followUpRequired}
              onChange={(e) => setData(prev => ({ ...prev, followUpRequired: e.target.value }))}
              placeholder="What follow-up actions are needed? Who needs to be contacted? What communications are pending?"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Critical Deadlines Section */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Deadlines & Time-Sensitive Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="critical-deadlines">Important Dates & Deadlines</Label>
            <Textarea
              id="critical-deadlines"
              value={data.criticalDeadlines}
              onChange={(e) => setData(prev => ({ ...prev, criticalDeadlines: e.target.value }))}
              placeholder="List all critical deadlines, important meetings, or time-sensitive commitments"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Complete Knowledge Transfer
        </Button>
      </div>
    </div>
  );
};