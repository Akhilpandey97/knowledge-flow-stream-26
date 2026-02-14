import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, ArrowLeftRight, UserCheck, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, loggingOut } = useAuth();
  if (!user) return null;

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'exiting': return 'Exiting Employee';
      case 'successor': return 'Successor';
      case 'hr-manager': return 'HR Manager';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'hr-manager': return <Building2 className="h-3.5 w-3.5" />;
      case 'successor': return <UserCheck className="h-3.5 w-3.5" />;
      case 'admin': return <Shield className="h-3.5 w-3.5" />;
      default: return <ArrowLeftRight className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enterprise Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm enterprise-shadow">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <ArrowLeftRight className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Seamless
                </span>
              </div>
              <div className="hidden md:block h-6 w-px bg-border" />
              <span className="hidden md:block text-sm text-muted-foreground">
                {user.department || 'Knowledge Transfer'}
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 font-normal text-xs px-2.5 py-1 border-border text-muted-foreground">
                {getRoleIcon(user.role)}
                {getRoleDisplayName(user.role)}
              </Badge>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                disabled={loggingOut}
                className="text-muted-foreground hover:text-foreground h-8 px-2.5"
              >
                <LogOut className={`h-4 w-4 ${loggingOut ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        className="container mx-auto px-6 py-8 max-w-7xl"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {children}
      </motion.main>
    </div>
  );
};
