import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  FileDown,
  Eye,
  MessageSquare
} from 'lucide-react';
import { DepartmentProgress } from '@/types/handover';
import { DepartmentDetailModal } from './DepartmentDetailModal';
import { ExportButton } from '@/components/ui/export-button';

const mockDepartmentData: DepartmentProgress[] = [
  {
    department: 'Sales',
    progress: 68,
    totalHandovers: 3,
    completedHandovers: 1,
    criticalIssues: 2
  },
  {
    department: 'Marketing',
    progress: 100,
    totalHandovers: 1,
    completedHandovers: 1,
    criticalIssues: 0
  },
  {
    department: 'Engineering',
    progress: 45,
    totalHandovers: 2,
    completedHandovers: 0,
    criticalIssues: 1
  },
  {
    department: 'Finance',
    progress: 85,
    totalHandovers: 1,
    completedHandovers: 0,
    criticalIssues: 0
  }
];

const mockActiveHandovers = [
  {
    id: '1',
    exitingEmployee: 'John Doe',
    successor: 'Sarah Wilson',
    department: 'Sales',
    position: 'Senior Sales Manager',
    progress: 68,
    dueDate: '2024-01-15',
    status: 'in-progress' as const,
    criticalGaps: 2
  },
  {
    id: '2',
    exitingEmployee: 'Michael Chen',
    successor: 'Not Assigned',
    department: 'Engineering',
    position: 'Lead Developer',
    progress: 45,
    dueDate: '2024-01-20',
    status: 'in-progress' as const,
    criticalGaps: 1
  },
  {
    id: '3',
    exitingEmployee: 'Lisa Rodriguez',
    successor: 'Tom Anderson',
    department: 'Finance',
    position: 'Financial Analyst',
    progress: 85,
    dueDate: '2024-01-18',
    status: 'review' as const,
    criticalGaps: 0
  }
];

export const HRManagerDashboard: React.FC = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const totalHandovers = mockDepartmentData.reduce((sum, dept) => sum + dept.totalHandovers, 0);
  const completedHandovers = mockDepartmentData.reduce((sum, dept) => sum + dept.completedHandovers, 0);
  const totalCriticalIssues = mockDepartmentData.reduce((sum, dept) => sum + dept.criticalIssues, 0);
  const overallProgress = Math.round(mockDepartmentData.reduce((sum, dept) => sum + dept.progress, 0) / mockDepartmentData.length);

  const getProgressVariant = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'review': return 'warning';
      case 'in-progress': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">HR Management Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor all knowledge transfers across departments
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton title="Export Report" />
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Manage Handovers
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {totalCriticalIssues > 0 && (
        <Alert variant="destructive" className="border-critical/20 bg-critical-soft">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                <strong>{totalCriticalIssues} critical issue{totalCriticalIssues > 1 ? 's' : ''}</strong> requiring immediate attention across departments.
              </span>
              <Button variant="destructive" size="sm">
                Review Issues
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-soft rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{overallProgress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-soft rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalHandovers}</div>
                <div className="text-sm text-muted-foreground">Active Handovers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-soft rounded-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{completedHandovers}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-critical-soft rounded-lg">
                <AlertTriangle className="h-6 w-6 text-critical" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCriticalIssues}</div>
                <div className="text-sm text-muted-foreground">Critical Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Progress */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Department Progress Overview
          </CardTitle>
          <CardDescription>Track handover completion across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockDepartmentData.map((dept) => (
              <div 
                key={dept.department} 
                className="space-y-3 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                onClick={() => setSelectedDepartment(dept.department)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{dept.department}</h4>
                    {dept.criticalIssues > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {dept.criticalIssues} critical
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{dept.progress}%</div>
                    <div className="text-xs text-muted-foreground">
                      {dept.completedHandovers}/{dept.totalHandovers} completed
                    </div>
                  </div>
                </div>
                <Progress 
                  value={dept.progress} 
                  variant={getProgressVariant(dept.progress)}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Handovers */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Active Handovers
          </CardTitle>
          <CardDescription>Monitor individual knowledge transfer progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockActiveHandovers.map((handover) => (
              <div key={handover.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{handover.exitingEmployee} → {handover.successor}</h4>
                    <p className="text-sm text-muted-foreground">
                      {handover.position} • {handover.department}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getStatusColor(handover.status) as any} className="text-xs">
                      {handover.status.replace('-', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Due {new Date(handover.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{handover.progress}%</span>
                  </div>
                  <Progress 
                    value={handover.progress} 
                    variant={getProgressVariant(handover.progress)}
                    className="h-1.5"
                  />
                </div>

                {handover.criticalGaps > 0 && (
                  <Alert className="border-critical/20 bg-critical-soft py-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {handover.criticalGaps} critical gap{handover.criticalGaps > 1 ? 's' : ''} identified
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Contact Team
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Detail Modal */}
      <DepartmentDetailModal
        isOpen={!!selectedDepartment}
        onClose={() => setSelectedDepartment(null)}
        department={selectedDepartment || ''}
      />
    </div>
  );
};