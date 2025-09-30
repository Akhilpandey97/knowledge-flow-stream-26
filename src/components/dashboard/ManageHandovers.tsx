import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { useRealHandovers } from '@/hooks/useRealHandovers';
import { 
  Users, 
  Plus, 
  ArrowLeft,
  UserPlus,
  Loader2,
  AlertTriangle
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
  // Use real data hooks
  const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsersManagement();
  const { handovers, loading: handoversLoading, error: handoversError, refetch: refetchHandovers, createHandover } = useRealHandovers();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddExitingModalOpen, setIsAddExitingModalOpen] = useState(false);
  const [isAddSuccessorModalOpen, setIsAddSuccessorModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  
  const [formData, setFormData] = useState({
    exitingEmployee: '',
    successor: '',
    department: ''
  });

  const [newUserData, setNewUserData] = useState({
    email: '',
    role: '',
    department: '',
    password: ''
  });

  // Filter users by role
  const exitingEmployees = users.filter(user => user.role === 'exiting');
  const successors = users.filter(user => user.role === 'successor');
  const allEmployees = users.filter(user => user.role === 'exiting' || user.role === 'successor');

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

  const handleCreateHandover = async () => {
    if (!formData.exitingEmployee) {
      toast({
        title: "Error",
        description: "Please select an exiting employee",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createHandover(
        formData.exitingEmployee,
        formData.successor || undefined
      );

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Handover created successfully!",
      });

      setIsCreateModalOpen(false);
      setFormData({
        exitingEmployee: '',
        successor: '',
        department: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create handover",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (role: 'exiting' | 'successor') => {
    if (!newUserData.email || !newUserData.role || !newUserData.department || !newUserData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Send signup email - this will now also create the user record with proper Auth ID
      const { error: emailError } = await supabase.functions.invoke('send-signup-email', {
        body: {
          email: newUserData.email,
          role: newUserData.role,
          department: newUserData.department,
          password: newUserData.password,
        },
      });

      if (emailError) {
        console.error('Error sending invite:', emailError);
        toast({
          title: "Error",
          description: "Failed to send signup invitation. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `${role === 'exiting' ? 'Exiting employee' : 'Successor'} invited successfully! They will receive a signup email.`,
        });
      }

      // Reset form and close modal
      setNewUserData({ email: '', role: '', department: '', password: '' });
      if (role === 'exiting') {
        setIsAddExitingModalOpen(false);
      } else {
        setIsAddSuccessorModalOpen(false);
      }
      
      // Refresh users list
      refetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: errorMessage || "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSuccessors = successors.filter(user => 
    user.id !== formData.exitingEmployee && 
    (!formData.department || user.department === formData.department)
  );

  const isDataLoading = usersLoading || handoversLoading;

  return (
    <div className="space-y-6">
      {/* Loading state */}
      {isDataLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading data...</span>
        </div>
      )}

      {/* Error states */}
      {(usersError || handoversError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading data: {usersError || handoversError}. Please refresh the page.
          </AlertDescription>
        </Alert>
      )}

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
                      {exitingEmployees.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email.split('@')[0]} - {user.department || 'No Department'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="successor">Successor (Optional)</Label>
                  <Select value={formData.successor} onValueChange={(value) => setFormData({...formData, successor: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select successor or leave empty" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSuccessors.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email.split('@')[0]} - {user.department || 'No Department'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateHandover} 
                    className="flex-1"
                    disabled={loading || !formData.exitingEmployee}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Handover'
                    )}
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

                <div className="space-y-2">
                  <Label htmlFor="exitingPassword">Password</Label>
                  <Input
                    id="exitingPassword"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    placeholder="Enter password"
                  />
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

                <div className="space-y-2">
                  <Label htmlFor="successorPassword">Password</Label>
                  <Input
                    id="successorPassword"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    placeholder="Enter password"
                  />
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
        </CardContent>
      </Card>

      {/* Current Handovers */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Active Handovers
            <Badge variant="secondary" className="ml-auto">
              {handovers.length} total
            </Badge>
          </CardTitle>
          <CardDescription>Monitor and manage ongoing knowledge transfers</CardDescription>
        </CardHeader>
        <CardContent>
          {!isDataLoading && handovers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No handovers yet</h3>
              <p className="text-sm">Get started by creating your first handover or adding users to the system.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {handovers.map((handover) => {
                const tasks = handover.tasks || [];
                const taskCount = tasks.length;
                const completedTasks = tasks.filter(task => task.status === 'completed').length;
                const progress = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : handover.progress || 0;
                
                return (
                  <div key={handover.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          {handover.employee?.email?.split('@')[0] || 'Unknown'} → {handover.successor?.email?.split('@')[0] || 'Not Assigned'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {handover.employee?.department || 'No Department'} Department
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{handover.employee?.email}</span>
                          {handover.successor?.email && (
                            <>
                              <span>→</span>
                              <span>{handover.successor.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge 
                          variant={progress >= 80 ? 'default' : progress >= 50 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {progress >= 80 ? 'Near Complete' : progress >= 50 ? 'In Progress' : 'Getting Started'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(handover.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-1.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        {completedTasks} of {taskCount} tasks completed
                      </p>
                    </div>

                    {!handover.successor_id && (
                      <Alert className="border-critical/20 bg-critical-soft py-2">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          No successor assigned - knowledge at risk
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Summary */}
      {!isDataLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserPlus className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{exitingEmployees.length}</div>
                  <div className="text-sm text-muted-foreground">Exiting Employees</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{successors.length}</div>
                  <div className="text-sm text-muted-foreground">Successors Available</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{users.length}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};