import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, CheckSquare, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminStats } from '@/components/admin/AdminStats';
import ChecklistBuilder from '@/components/admin/ChecklistBuilder';
import InsightFormBuilder from '@/components/admin/InsightFormBuilder';
import { AIInsightTitlesManager } from '@/components/admin/AIInsightTitlesManager';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0, exitingEmployees: 0, successors: 0, hrManagers: 0, activeHandovers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: users, error: usersError } = await supabase.from('users').select('role');
      if (usersError) throw usersError;
      const { data: handovers, error: handoversError } = await supabase.from('handovers').select('id').lt('progress', 100);
      if (handoversError) throw handoversError;
      const roleStats = users?.reduce((acc, user) => { acc[user.role] = (acc[user.role] || 0) + 1; return acc; }, {} as Record<string, number>) || {};
      setStats({
        totalUsers: users?.length || 0, exitingEmployees: roleStats.exiting || 0,
        successors: roleStats.successor || 0, hrManagers: roleStats['hr-manager'] || 0,
        activeHandovers: handovers?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({ title: "Error", description: "Failed to load dashboard statistics", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Administration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">System configuration and user management</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-4 w-4" />
          <span>Admin Panel</span>
        </div>
      </div>

      <AdminStats stats={stats} loading={loading} />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="users" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" />Users</TabsTrigger>
          <TabsTrigger value="checklists" className="text-xs gap-1.5"><CheckSquare className="h-3.5 w-3.5" />Checklists</TabsTrigger>
          <TabsTrigger value="insight-forms" className="text-xs gap-1.5"><FileText className="h-3.5 w-3.5" />Insight Forms</TabsTrigger>
          <TabsTrigger value="ai-titles" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" />AI Titles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6"><UserManagement onStatsUpdate={fetchStats} /></TabsContent>
        <TabsContent value="checklists" className="space-y-6"><ChecklistBuilder /></TabsContent>
        <TabsContent value="insight-forms" className="space-y-6"><InsightFormBuilder /></TabsContent>
        <TabsContent value="ai-titles" className="space-y-6"><AIInsightTitlesManager /></TabsContent>
      </Tabs>
    </div>
  );
};
