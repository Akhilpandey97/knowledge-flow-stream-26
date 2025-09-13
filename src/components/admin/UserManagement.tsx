import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from '../ui/use-toast';

type UserRole = 'exiting' | 'successor' | 'hr-manager' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

export const UserManagement: React.FC<{ onStatsUpdate: () => void }> = ({ onStatsUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'exiting',
    password: '', // <-- Added password to form state
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers((data || []).map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Create user handler
  const handleCreateUser = async () => {
    try {
      // Validate form data
      if (!formData.email.trim()) {
        toast({
          title: "Validation Error",
          description: "Email is required",
          variant: "destructive",
        });
        return;
      }

      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      if (!formData.password.trim()) {
        toast({
          title: "Validation Error",
          description: "Password is required",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      // Call edge function to create user with auth and profile
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create',
          email: formData.email.trim(),
          role: formData.role,
          password: formData.password,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (data && data.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: `User created successfully with email: ${formData.email}`,
      });

      setIsCreateDialogOpen(false);
      setFormData({ email: '', role: 'exiting', password: '' });
      fetchUsers();
      onStatsUpdate();
    } catch (error: unknown) {
      console.error('Error creating user:', error);

      let errorMessage = "Failed to create user";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Modal/dialog code
  const renderCreateUserDialog = () => (
    isCreateDialogOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg min-w-[340px] max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4">Create User</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateUser();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter user email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="exiting">Exiting</option>
                <option value="successor">Successor</option>
                <option value="hr-manager">HR Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter a password (min. 6 characters)"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded border"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Create User
        </button>
      </div>
      {renderCreateUserDialog()}
      {/* ...other UI code for user list, etc. */}
    </div>
  );
};


