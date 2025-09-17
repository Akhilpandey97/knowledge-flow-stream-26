import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, FileText, Calendar, User } from 'lucide-react';

interface HandoverTask {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

interface Insight {
  id: string;
  taskId: string;
  topic: string;
  content: string;
  dateAdded: string;
  addedBy: string;
  attachments?: string[];
}

interface ShowInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: HandoverTask | null;
  onEditInsight: (insight: Insight) => void;
}

export const ShowInsightsModal: React.FC<ShowInsightsModalProps> = ({
  isOpen,
  onClose,
  task,
  onEditInsight
}) => {
  // Sample insights data - in real app, this would come from props or API
  const [insights] = useState<Insight[]>([
    {
      id: '1',
      taskId: '1',
      topic: 'Client Relationship',
      content: 'TechCorp has been our client for 3 years. Main contact is Sarah Johnson (CTO). They prefer weekly status updates and are very responsive to email communication. Key thing to remember: they always want detailed technical documentation.',
      dateAdded: '2024-01-10',
      addedBy: 'John Smith',
      attachments: ['techcorp-contact-list.pdf']
    },
    {
      id: '2', 
      taskId: '1',
      topic: 'Project History',
      content: 'We have successfully delivered 4 major projects for TechCorp. The most recent one was their mobile app redesign which increased user engagement by 40%. They are planning to expand internationally next quarter.',
      dateAdded: '2024-01-12',
      addedBy: 'John Smith'
    },
    {
      id: '3',
      taskId: '1', 
      topic: 'Account Management',
      content: 'Monthly revenue from TechCorp is $50K. Contract renewal is due in March 2024. They have expressed interest in our new AI services. Important: always CC Sarah on important emails.',
      dateAdded: '2024-01-15',
      addedBy: 'John Smith',
      attachments: ['techcorp-contract.pdf', 'revenue-report.xlsx']
    }
  ]);

  const taskInsights = insights.filter(insight => insight.taskId === task?.id);

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Insights for {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Task Context */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              <p className="text-xs text-gray-500">Category: {task.category}</p>
            </CardContent>
          </Card>

          {/* Insights List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Collected Insights ({taskInsights.length})
              </h3>
            </div>

            {taskInsights.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No insights added yet</h4>
                  <p className="text-gray-600">Start by adding your first insight for this task.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {taskInsights.map(insight => (
                  <Card key={insight.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            {insight.topic}
                          </Badge>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(insight.dateAdded).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            {insight.addedBy}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditInsight(insight)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                      
                      <p className="text-gray-700 text-sm leading-relaxed mb-4">
                        {insight.content}
                      </p>
                      
                      {insight.attachments && insight.attachments.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                          <p className="text-xs text-gray-500 mb-2">Attachments:</p>
                          <div className="flex flex-wrap gap-2">
                            {insight.attachments.map((attachment, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {attachment}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};