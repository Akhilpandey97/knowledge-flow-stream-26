import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExitingEmployeeDashboard } from '@/components/dashboard/ExitingEmployeeDashboard';
import { SuccessorDashboard } from '@/components/dashboard/SuccessorDashboard';
import { HRManagerDashboard } from '@/components/dashboard/HRManagerDashboard';

const Index = () => {
  const { user, isAuthenticated } = useAuth();

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
