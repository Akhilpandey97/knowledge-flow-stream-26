import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ExitingEmployeeDashboard } from '@/components/dashboard/ExitingEmployeeDashboard';
import { SuccessorDashboard } from '@/components/dashboard/SuccessorDashboard';
import { HRManagerDashboard } from '@/components/dashboard/HRManagerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { DemoDocumentUpload } from '@/components/demo/DemoDocumentUpload';
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

  // Check if we're in a sandboxed environment where Supabase connection fails
  // Show demo instead to demonstrate the fixes
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true' || (!isAuthenticated && window.location.host.includes('localhost'))) {
    return <DemoDocumentUpload />;
  }

  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
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
