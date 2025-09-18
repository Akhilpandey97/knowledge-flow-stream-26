import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  AlertTriangle,
  Calendar,
  ArrowLeft
} from 'lucide-react';

interface HandoverRecord {
  id: string;
  exitingEmployee: string;
  successor: string;
  department: string;
  position: string;
  progress: number;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'review' | 'completed';
  criticalGaps: number;
}

interface ManageHandoversProps {
  onBack: () => void;
}

// Mock data for existing handovers
const mockHandovers: HandoverRecord[] = [
  {
    id: '1',
    exitingEmployee: 'John Doe',
    successor: 'Sarah Wilson',
    department: 'Sales',
    position: 'Senior Sales Manager',
    progress: 68,
    dueDate: '2024-01-15',
    status: 'in-progress',
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
    status: 'in-progress',
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
    status: 'review',
    criticalGaps: 0
  }
];

// Mock employees data
const mockEmployees = [
  { id: '1', name: 'John Doe', department: 'Sales', position: 'Senior Sales Manager' },
  { id: '2', name: 'Michael Chen', department: 'Engineering', position: 'Lead Developer' },
  { id: '3', name: 'Lisa Rodriguez', department: 'Finance', position: 'Financial Analyst' },
  { id: '4', name: 'Sarah Wilson', department: 'Sales', position: 'Sales Manager' },
  { id: '5', name: 'Tom Anderson', department: 'Finance', position: 'Junior Analyst' },
  { id: '6', name: 'Emma Davis', department: 'Marketing', position: 'Marketing Specialist' },
  { id: '7', name: 'Alex Johnson', department: 'Engineering', position: 'Senior Developer' },
];

const departments = ['Sales', 'Engineering', 'Finance', 'Marketing', 'HR', 'Operations'];

export const ManageHandovers: React.FC<ManageHandoversProps> = ({ onBack }) => {
  const [handovers, setHandovers] = useState<HandoverRecord[]>(mockHandovers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    exitingEmployee: '',
    successor: '',
    department: '',
    position: '',
    dueDate: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'review': return 'warning';
      case 'in-progress': return 'secondary';
      case 'not-started': return 'outline';
      default: return 'secondary';
    }
  };

  const getProgressVariant = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'critical';
  };

  const handleCreateHandover = () => {
    if (!formData.exitingEmployee || !formData.department || !formData.position || !formData.dueDate) {
      return;
    }

    const exitingEmployeeObj = mockEmployees.find(emp => emp.id === formData.exitingEmployee);
    const successorObj = formData.successor ? mockEmployees.find(emp => emp.id === formData.successor) : null;

    const newHandover: HandoverRecord = {
      id: Date.now().toString(),
      exitingEmployee: exitingEmployeeObj?.name || '',
      successor: successorObj?.name || 'Not Assigned',
      department: formData.department,
      position: formData.position,
      progress: 0,
      dueDate: formData.dueDate,
      status: 'not-started',
      criticalGaps: 0
    };

    setHandovers([...handovers, newHandover]);
    setIsCreateModalOpen(false);
    setFormData({
      exitingEmployee: '',
      successor: '',
      department: '',
      position: '',
      dueDate: ''
    });
  };

  const filteredSuccessors = mockEmployees.filter(emp => 
    emp.id !== formData.exitingEmployee && 
    (formData.department === '' || emp.department === formData.department)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-foreground">Manage Handovers</h2>
          <p className="text-muted-foreground">
            Create and manage knowledge transfer processes
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Handover
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Handover</DialogTitle>
              <DialogDescription>
                Set up a new knowledge transfer process between employees
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exitingEmployee">Exiting Employee</Label>
                <Select value={formData.exitingEmployee} onValueChange={(value) => setFormData({...formData, exitingEmployee: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exiting employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="Enter position title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="successor">Successor (Optional)</Label>
                <Select value={formData.successor} onValueChange={(value) => setFormData({...formData, successor: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select successor or leave empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSuccessors.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateHandover} className="flex-1">
                  Create Handover
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-soft rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{handovers.length}</div>
                <div className="text-sm text-muted-foreground">Total Handovers</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-soft rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{handovers.filter(h => h.status === 'in-progress').length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning-soft rounded-lg">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{handovers.filter(h => h.successor === 'Not Assigned').length}</div>
                <div className="text-sm text-muted-foreground">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-critical-soft rounded-lg">
                <AlertTriangle className="h-6 w-6 text-critical" />
              </div>
              <div>
                <div className="text-2xl font-bold">{handovers.reduce((sum, h) => sum + h.criticalGaps, 0)}</div>
                <div className="text-sm text-muted-foreground">Critical Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Handovers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Handovers
          </CardTitle>
          <CardDescription>View and manage all knowledge transfer processes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {handovers.map((handover) => (
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
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        getProgressVariant(handover.progress) === 'success' ? 'bg-success' :
                        getProgressVariant(handover.progress) === 'warning' ? 'bg-warning' : 'bg-critical'
                      }`}
                      style={{ width: `${handover.progress}%` }}
                    />
                  </div>
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
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Handover
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