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
  Eye,
  MessageSquare
} from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import { ManageHandovers } from './ManageHandovers';

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
  const [showManageHandovers, setShowManageHandovers] = useState(false);
  
  // Calculate stats from active handovers
  const totalHandovers = mockActiveHandovers.length;
  const completedHandovers = mockActiveHandovers.filter(h => h.status === 'review' || h.status === 'completed').length;
  const totalCriticalIssues = mockActiveHandovers.reduce((sum, handover) => sum + handover.criticalGaps, 0);
  const overallProgress = Math.round(mockActiveHandovers.reduce((sum, handover) => sum + handover.progress, 0) / mockActiveHandovers.length);

  // If showing manage handovers interface, render that instead
  if (showManageHandovers) {
    return <ManageHandovers onBack={() => setShowManageHandovers(false)} />;
  }

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
          <Button onClick={() => setShowManageHandovers(true)}>
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
    </div>
  );
};