import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  AlertTriangle, 
  Clock,
  MessageSquare,
  Calendar,
  Eye,
  X
} from 'lucide-react';

interface DepartmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: string;
}

// Mock data for department details
const departmentDetails = {
  Sales: {
    handovers: [
      {
        id: '1',
        employee: 'John Doe',
        successor: 'Sarah Wilson',
        position: 'Senior Sales Manager',
        progress: 68,
        dueDate: '2024-01-15',
        criticalIssues: ['Renewal Risk Assessment missing', 'Client contact details incomplete']
      }
    ]
  },
  Finance: {
    handovers: [
      {
        id: '2',
        employee: 'Lisa Rodriguez',
        successor: 'Tom Anderson',
        position: 'Financial Analyst',
        progress: 85,
        dueDate: '2024-01-18',
        criticalIssues: []
      }
    ]
  },
  Engineering: {
    handovers: [
      {
        id: '3',
        employee: 'Michael Chen',
        successor: 'Not Assigned',
        position: 'Lead Developer',
        progress: 45,
        dueDate: '2024-01-20',
        criticalIssues: ['Code documentation missing']
      }
    ]
  }
};

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  isOpen,
  onClose,
  department
}) => {
  const deptData = departmentDetails[department as keyof typeof departmentDetails];

  if (!deptData) return null;

  const getProgressVariant = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'critical';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {department} Department Details
          </DialogTitle>
          <DialogDescription>
            Detailed view of all handovers in the {department} department
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {deptData.handovers.map((handover) => (
            <Card key={handover.id} className="shadow-medium">
              <CardContent className="p-6 space-y-4">
                {/* Employee Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {handover.employee} → {handover.successor}
                    </h3>
                    <p className="text-sm text-muted-foreground">{handover.position}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{handover.progress}%</div>
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(handover.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Handover Progress</span>
                    <span className="font-medium">{handover.progress}%</span>
                  </div>
                  <Progress 
                    value={handover.progress} 
                    variant={getProgressVariant(handover.progress)}
                    className="h-2"
                  />
                </div>

                {/* Critical Issues */}
                {handover.criticalIssues.length > 0 && (
                  <Alert variant="destructive" className="border-critical/20 bg-critical-soft">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-medium">Critical Issues:</div>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {handover.criticalIssues.map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View Full Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Contact Employee
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule Review
                  </Button>
                  {handover.criticalIssues.length > 0 && (
                    <Button variant="destructive" size="sm">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Address Issues
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};