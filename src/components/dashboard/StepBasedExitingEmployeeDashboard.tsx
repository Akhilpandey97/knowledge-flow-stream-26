import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Target, Plus, Edit3, Video, LogOut, User, Users, UserCheck } from 'lucide-react';
import { DocumentUploadScreen } from './DocumentUploadScreen';
import { InsightCollectionModal } from './InsightCollectionModal';
import { ZoomMeetingModal } from './ZoomMeetingModal';
import { ShowInsightsModal } from './ShowInsightsModal';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
interface HandoverTask {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}
export const StepBasedExitingEmployeeDashboard: React.FC = () => {
  const { hasUploadedDocument, loading, markDocumentUploaded } = useDocumentUpload();
  const [activeTab, setActiveTab] = useState('exiting');
  const [demoMode, setDemoMode] = useState(true);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [isShowInsightsModalOpen, setIsShowInsightsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HandoverTask | null>(null);

  // Sample handover tasks data
  const [tasks, setTasks] = useState<HandoverTask[]>([{
    id: '1',
    title: 'Client Account Handover - TechCorp',
    description: 'Transfer all TechCorp account details, meeting notes, and contact information',
    category: 'Client Management',
    isCompleted: true,
    priority: 'critical',
    notes: 'Completed meeting with Sarah. All files transferred.'
  }, {
    id: '2',
    title: 'Project Documentation - Mobile App',
    description: 'Document current project status and next steps',
    category: 'Project Management',
    isCompleted: false,
    priority: 'high'
  }, {
    id: '3',
    title: 'Team Introductions',
    description: 'Introduce successor to key team members and stakeholders',
    category: 'Team Management',
    isCompleted: false,
    priority: 'medium'
  }, {
    id: '4',
    title: 'System Access & Credentials',
    description: 'Transfer system access and document credentials',
    category: 'System Management',
    isCompleted: true,
    priority: 'critical'
  }]);
  const completedTasks = tasks.filter(task => task.isCompleted).length;
  const totalTasks = tasks.length;
  const progressPercentage = Math.round(completedTasks / totalTasks * 100);
  const remainingTasks = totalTasks - completedTasks;
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

  const handleShowInsightsClick = (task: HandoverTask) => {
    setSelectedTask(task);
    setIsShowInsightsModalOpen(true);
  };

  const handleSaveInsights = (taskId: string, topic: string, insights: string, file?: File) => {
    // Update the task with insights and mark as completed
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              isCompleted: true, 
              notes: `${topic}: ${insights}` 
            }
          : task
      )
    );
    
    // Log the file if provided (in real app, upload to server)
    if (file) {
      console.log('File would be uploaded:', file.name);
    }
    
    setIsInsightModalOpen(false);
    setSelectedTask(null);
  };

  const handleEditInsight = (insight: any) => {
    // In real app, this would open an edit modal
    console.log('Edit insight:', insight);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: !task.isCompleted }
          : task
      )
    );
  };

  // Show document upload screen only for first-time users (who haven't uploaded before)
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!hasUploadedDocument) {
    return <DocumentUploadScreen onUploadComplete={markDocumentUploaded} />;
  }
  return <div className="min-h-screen bg-gray-50">
      {/* Header */}
      

      {/* Navigation Tabs */}
      

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Knowledge Handover Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Handover</h2>
            <p className="text-lg text-gray-600">Transferring knowledge to <span className="font-semibold">Sarah Wilson</span></p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Target className="h-5 w-5" />
            <span className="text-sm">Target completion: <span className="font-semibold">Jan 15, 2024</span></span>
          </div>
        </div>

        {/* Handover Progress Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Handover Progress</h3>
            </div>
            <p className="text-gray-600 mb-6">Track your knowledge transfer completion</p>
            
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-900">Overall Progress</span>
              <span className="text-3xl font-bold text-blue-600">{progressPercentage}%</span>
            </div>
            
            <div className="mb-4">
              <Progress value={progressPercentage} className="h-3 bg-gray-200" style={{
              "--progress-bar-color": "#f97316"
            } as React.CSSProperties} />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{completedTasks} of {totalTasks} tasks completed</span>
              <span>{remainingTasks} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Transfer Checklist */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Knowledge Transfer Checklist</h3>
            <p className="text-gray-600 mb-6">Complete these domain-specific tasks for a smooth handover</p>
            
            <div className="space-y-4">
              {tasks.map(task => <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <button
                        onClick={() => handleTaskToggle(task.id)}
                        className="transition-colors hover:scale-110 transform transition-transform duration-200"
                      >
                        <CheckCircle className={`h-5 w-5 ${task.isCompleted ? 'text-blue-600' : 'text-gray-300 hover:text-gray-400'}`} />
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      <p className="text-xs text-gray-500 mb-3">Category: {task.category}</p>
                      
                      {task.notes && <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Notes Added</span>
                          </div>
                          <p className="text-sm text-green-700">{task.notes}</p>
                        </div>}
                      
                      <div className="flex gap-3">
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
                          onClick={() => handleShowInsightsClick(task)}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Show Insights
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
                </div>)}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Insight Collection Modal */}
      <InsightCollectionModal
        isOpen={isInsightModalOpen}
        onClose={() => setIsInsightModalOpen(false)}
        task={selectedTask}
        onSaveAndNext={handleSaveInsights}
      />

      {/* Zoom Meeting Modal */}
      <ZoomMeetingModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        task={selectedTask}
        allTasks={tasks}
      />

      {/* Show Insights Modal */}
      <ShowInsightsModal
        isOpen={isShowInsightsModalOpen}
        onClose={() => setIsShowInsightsModalOpen(false)}
        task={selectedTask}
        onEditInsight={handleEditInsight}
      />
    </div>;
};