import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Settings, Users, UserCheck, Building2 } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { motion } from 'framer-motion';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'exiting': return 'Exiting Employee';
      case 'successor': return 'Successor';
      case 'hr-manager': return 'HR Manager';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'exiting': return User;
      case 'successor': return UserCheck;
      case 'hr-manager': return Building2;
      default: return User;
    }
  };

  const switchRole = (newRole: UserRole) => {
    // Mock role switching - in real app this would be API call
    const mockUsers = {
      'exiting': {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'exiting' as UserRole,
        department: 'Sales',
        avatar: ''
      },
      'successor': {
        id: '2',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        role: 'successor' as UserRole,
        department: 'Sales',
        avatar: ''
      },
      'hr-manager': {
        id: '3',
        name: 'Emily Chen',
        email: 'hr@company.com',
        role: 'hr-manager' as UserRole,
        department: 'Human Resources',
        avatar: ''
      }
    };

    const newUser = mockUsers[newRole];
    localStorage.setItem('auth-user', JSON.stringify(newUser));
    window.location.reload(); // Simple reload to switch roles
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Seamless Handover
              </h1>
              <div className="hidden md:block text-sm text-muted-foreground">
                {user.department} Department
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{getRoleDisplayName(user.role)}</div>
              </div>
              
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Role Navigation */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex space-x-1">
                {(['exiting', 'successor', 'hr-manager'] as UserRole[]).map((role) => {
                  const Icon = getRoleIcon(role);
                  const isActive = user.role === role;
                  
                  return (
                    <motion.button
                      key={role}
                      onClick={() => switchRole(role)}
                      className={`
                        relative px-4 py-3 text-sm font-medium transition-colors
                        ${isActive 
                          ? 'text-primary' 
                          : 'text-muted-foreground hover:text-foreground'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{getRoleDisplayName(role)}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                          initial={false}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div className="py-3">
              <Badge variant="outline" className="text-xs">
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.main 
        className="container mx-auto px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {children}
      </motion.main>
    </div>
  );
};