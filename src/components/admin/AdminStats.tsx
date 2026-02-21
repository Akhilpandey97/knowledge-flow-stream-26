import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserPlus, Briefcase, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    exitingEmployees: number;
    successors: number;
    hrManagers: number;
    activeHandovers: number;
  };
  loading: boolean;
}

export const AdminStats: React.FC<AdminStatsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="glass-panel">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, bgClass: 'bg-primary/10', iconClass: 'text-primary' },
    { title: "Exiting", value: stats.exitingEmployees, icon: UserCheck, bgClass: 'bg-[hsl(var(--warning))]/10', iconClass: 'text-[hsl(var(--warning))]' },
    { title: "Successors", value: stats.successors, icon: UserPlus, bgClass: 'bg-[hsl(var(--success))]/10', iconClass: 'text-[hsl(var(--success))]' },
    { title: "HR Managers", value: stats.hrManagers, icon: Briefcase, bgClass: 'bg-primary/10', iconClass: 'text-primary' },
    { title: "Active Handovers", value: stats.activeHandovers, icon: TrendingUp, bgClass: 'bg-[hsl(var(--critical))]/10', iconClass: 'text-[hsl(var(--critical))]' },
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="glass-panel enterprise-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${stat.bgClass} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${stat.iconClass}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
