import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Settings, CheckSquare, FileText, Sparkles, Building2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserManagement } from '@/components/admin/UserManagement';
import { AdminStats } from '@/components/admin/AdminStats';
import ChecklistBuilder from '@/components/admin/ChecklistBuilder';
import InsightFormBuilder from '@/components/admin/InsightFormBuilder';
import { AIInsightTitlesManager } from '@/components/admin/AIInsightTitlesManager';
import { TenantManagement } from '@/components/admin/TenantManagement';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'tenants', label: 'Tenants', icon: Building2, description: 'Organizations' },
  { id: 'users', label: 'Users', icon: Users, description: 'User accounts' },
  { id: 'checklists', label: 'Checklists', icon: CheckSquare, description: 'Templates' },
  { id: 'insight-forms', label: 'Insight Forms', icon: FileText, description: 'Form builder' },
  { id: 'ai-titles', label: 'AI Titles', icon: Sparkles, description: 'AI config' },
] as const;

type NavId = typeof NAV_ITEMS[number]['id'];

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<NavId>('tenants');
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

  const renderContent = () => {
    switch (activeSection) {
      case 'tenants': return <TenantManagement />;
      case 'users': return <UserManagement onStatsUpdate={fetchStats} />;
      case 'checklists': return <ChecklistBuilder />;
      case 'insight-forms': return <InsightFormBuilder />;
      case 'ai-titles': return <AIInsightTitlesManager />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Administration</h2>
          <p className="text-sm text-muted-foreground mt-0.5">System configuration and management</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          <span>Admin Panel</span>
        </div>
      </div>

      {/* Stats */}
      <AdminStats stats={stats} loading={loading} />

      {/* Sidebar + Content Layout */}
      <div className="flex gap-6 min-h-[600px]">
        {/* Sidebar Navigation */}
        <nav className="w-56 shrink-0">
          <Card className="glass-panel sticky top-4">
            <CardContent className="p-2">
              <div className="space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium leading-none', isActive ? 'text-primary-foreground' : '')}>{item.label}</p>
                        <p className={cn('text-xs mt-0.5 leading-none', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{item.description}</p>
                      </div>
                      <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isActive ? 'text-primary-foreground/70' : 'opacity-0 group-hover:opacity-50')} />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
