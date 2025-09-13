import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserCheck, UserPlus, Settings, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminStats } from '@/components/admin/AdminStats';
import { IntegrationsManager } from '@/components/admin/IntegrationsManager';
export const AdminDashboard = () => {
  const {
    user
  } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    exitingEmployees: 0,
    successors: 0,
    hrManagers: 0,
    activeHandovers: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchStats();
  }, []);
  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch user counts by role
      const {
        data: users,
        error: usersError
      } = await supabase.from('users').select('role');
      if (usersError) throw usersError;

      // Fetch active handovers count
      const {
        data: handovers,
        error: handoversError
      } = await supabase.from('handovers').select('id').lt('progress', 100);
      if (handoversError) throw handoversError;

      // Calculate stats
      const roleStats = users?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      setStats({
        totalUsers: users?.length || 0,
        exitingEmployees: roleStats.exiting || 0,
        successors: roleStats.successor || 0,
        hrManagers: roleStats['hr-manager'] || 0,
        activeHandovers: handovers?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span className="text-sm font-medium">System Administration</span>
        </div>
      </div>

      <AdminStats stats={stats} loading={loading} />

      <Tabs defaultValue="users" className="w-full">
        

        <TabsContent value="users" className="space-y-6">
          <UserManagement onStatsUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsManager />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          
        </TabsContent>
      </Tabs>
    </div>;
};