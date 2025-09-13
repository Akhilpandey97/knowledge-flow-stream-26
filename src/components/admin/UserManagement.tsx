import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { toast } from '../ui/use-toast';

type UserRole = 'exiting' | 'successor' | 'hr-manager' | 'admin';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

const UserManagement: React.FC<{ onStatsUpdate: () => void }> = ({ onStatsUpdate }) => {
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

      // Call edge function to create user with auth and profile
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create',
          email: formData.email.trim(),
          role: formData.role,
          password: formData.password, // <-- Send password from form
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
      setFormData({ email: '', role: 'exiting', password: '' }); // Reset password field
      fetchUsers();
      onStatsUpdate();
    } catch (error: any) {
      console.error('Error creating user:', error);

      let errorMessage = "Failed to create user";
      if (error.message) {
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

  // Update user handler (unchanged)
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          email: formData.email,
          role: formData.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditingUser(null);
      setFormData({ email: '', role: 'exiting', password: '' });
      fetchUsers();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-500';
      case 'hr-manager':
        return 'bg-green-500';
      case 'successor':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div>
      {/* ...other UI code... */}
      {isCreateDialogOpen && (
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
            >
              <option value="exiting">Exiting</option>
              <option value="successor">Successor</option>
              <option value="hr-manager">HR Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {/* Password input field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter a password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Create User</button>
        </form>
      )}
      {/* ...other UI code... */}
    </div>
  );
};

export default UserManagement;
