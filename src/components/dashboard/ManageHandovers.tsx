import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  ArrowLeft,
  UserPlus
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
  const [isAddExitingModalOpen, setIsAddExitingModalOpen] = useState(false);
  const [isAddSuccessorModalOpen, setIsAddSuccessorModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    exitingEmployee: '',
    successor: '',
    department: '',
    position: '',
    dueDate: ''
  });

  const [newUserData, setNewUserData] = useState({
    email: '',
    role: '',
    department: ''
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

  const handleAddUser = async (role: 'exiting' | 'successor') => {
    if (!newUserData.email || !newUserData.role || !newUserData.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: newUserData.email,
          role: newUserData.role,
        })
        .select()
        .single();

      if (userError) throw userError;

      // Send signup email
      const { error: emailError } = await supabase.functions.invoke('send-signup-email', {
        body: {
          email: newUserData.email,
          role: newUserData.role,
          department: newUserData.department,
        },
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast({
          title: "User Created",
          description: "User created successfully, but there was an issue sending the signup email.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `${role === 'exiting' ? 'Exiting employee' : 'Successor'} added successfully! Signup email sent.`,
        });
      }

      // Reset form and close modal
      setNewUserData({ email: '', role: '', department: '' });
      if (role === 'exiting') {
        setIsAddExitingModalOpen(false);
      } else {
        setIsAddSuccessorModalOpen(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuccessors = mockEmployees.filter(emp => 
    emp.id !== formData.exitingEmployee && 
    (formData.department === '' || emp.department === formData.department)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-3">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
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

          <Dialog open={isAddExitingModalOpen} onOpenChange={setIsAddExitingModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Exiting Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Exiting Employee</DialogTitle>
                <DialogDescription>
                  Add a new exiting employee to the system and send them a signup email
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exitingEmail">Email Address</Label>
                  <Input
                    id="exitingEmail"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="employee@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exitingRole">Role</Label>
                  <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exiting">Exiting Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exitingDepartment">Department</Label>
                  <Select value={newUserData.department} onValueChange={(value) => setNewUserData({...newUserData, department: value})}>
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

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleAddUser('exiting')} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Employee & Send Email'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddExitingModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddSuccessorModalOpen} onOpenChange={setIsAddSuccessorModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Successor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Successor</DialogTitle>
                <DialogDescription>
                  Add a new successor to the system and send them a signup email
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="successorEmail">Email Address</Label>
                  <Input
                    id="successorEmail"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="successor@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="successorRole">Role</Label>
                  <Select value={newUserData.role} onValueChange={(value) => setNewUserData({...newUserData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="successor">Successor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="successorDepartment">Department</Label>
                  <Select value={newUserData.department} onValueChange={(value) => setNewUserData({...newUserData, department: value})}>
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

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleAddUser('successor')} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Successor & Send Email'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddSuccessorModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Welcome Message */}
      <Card className="shadow-medium border-primary/20 bg-gradient-to-r from-primary-soft to-primary-soft/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Employee Transition Management</CardTitle>
          <CardDescription className="text-lg">
            Create and manage seamless knowledge transfers between employees
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            Use the tools above to set up new handover processes, add departing employees to the system, 
            or register new successors for knowledge transfer.
          </p>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Create structured handover processes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span>Track knowledge transfer progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span>Ensure seamless transitions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};