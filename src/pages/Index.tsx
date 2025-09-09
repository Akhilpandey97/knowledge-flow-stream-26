import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExitingEmployeeDashboard } from '@/components/dashboard/ExitingEmployeeDashboard';
import { SuccessorDashboard } from '@/components/dashboard/SuccessorDashboard';
import { HRManagerDashboard } from '@/components/dashboard/HRManagerDashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'exiting':
        return <ExitingEmployeeDashboard />;
      case 'successor':
        return <SuccessorDashboard />;
      case 'hr-manager':
        return <HRManagerDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Index;
