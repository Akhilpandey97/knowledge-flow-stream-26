import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  MessageCircle, 
  HelpCircle, 
  Clock, 
  CheckCircle,
  FileText,
  Video,
  User
} from 'lucide-react';
import { ChatModal } from './ChatModal';
import { EscalationModal } from './EscalationModal';
import { ExportButton } from '@/components/ui/export-button';

const mockHandoverData = {
  exitingEmployeeName: 'John Doe',
  progress: 68,
  targetDate: '2024-01-15',
  department: 'Sales',
  criticalGaps: [
    'Client renewal strategies for Q1 2024',
    'Custom CRM automation rules',
    'Stakeholder contact preferences'
  ],
  completedTasks: [
    {
      id: '1',
      title: 'Client Account Handover - TechCorp',
      category: 'Client Management',
      hasNotes: true,
      hasVideo: false,
      completedDate: '2024-01-05'
    },
    {
      id: '2',
      title: 'CRM Workflow Documentation',
      category: 'Systems & Tools',
      hasNotes: true,
      hasVideo: true,
      completedDate: '2024-01-04'
    }
  ],
  pendingTasks: [
    {
      id: '3',
      title: 'Renewal Risk Assessment',
      category: 'Strategic Planning',
      priority: 'critical',
      dueDate: '2024-01-10'
    },
    {
      id: '4',
      title: 'Team Introduction Sessions',
      category: 'Relationships',
      priority: 'medium',
      dueDate: '2024-01-12'
    }
  ]
};

export const SuccessorDashboard: React.FC = () => {
  const [chatModal, setChatModal] = useState(false);
  const [escalationModal, setEscalationModal] = useState(false);
  const daysUntilTarget = Math.ceil((new Date('2024-01-15').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Incoming Handover</h2>
          <p className="text-muted-foreground">
            Knowledge transfer from <span className="font-medium text-foreground">{mockHandoverData.exitingEmployeeName}</span>
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
          <CardDescription>Track the knowledge transfer from {mockHandoverData.exitingEmployeeName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transfer Progress</span>
              <span className="text-2xl font-bold text-primary">{mockHandoverData.progress}%</span>
            </div>
            <Progress 
              value={mockHandoverData.progress} 
              variant={mockHandoverData.progress >= 80 ? 'success' : mockHandoverData.progress >= 50 ? 'warning' : 'critical'}
              className="h-3"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{mockHandoverData.completedTasks.length}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{mockHandoverData.pendingTasks.length}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Missing Items Alert */}
      {mockHandoverData.criticalGaps.length > 0 && (
        <Alert variant="destructive" className="border-critical/20 bg-critical-soft">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Critical Missing Items Identified:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {mockHandoverData.criticalGaps.map((gap, index) => (
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
            {mockHandoverData.completedTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 bg-success-soft border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-success">{task.title}</h4>
                  <Badge variant="outline" className="text-xs border-success text-success">
                    Completed {new Date(task.completedDate).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Category: {task.category}</p>
                <div className="flex gap-2">
                  {task.hasNotes && (
                    <Button variant="outline" size="sm">
                      <FileText className="w-3 h-3 mr-1" />
                      View Notes
                    </Button>
                  )}
                  {task.hasVideo && (
                    <Button variant="outline" size="sm">
                      <Video className="w-3 h-3 mr-1" />
                      Watch Video
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
          <CardDescription>Items still being prepared by {mockHandoverData.exitingEmployeeName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockHandoverData.pendingTasks.map((task) => (
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
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Category: {task.category}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModal}
        onClose={() => setChatModal(false)}
        exitingEmployeeName={mockHandoverData.exitingEmployeeName}
      />

      {/* Escalation Modal */}
      <EscalationModal
        isOpen={escalationModal}
        onClose={() => setEscalationModal(false)}
      />
    </div>
  );
};