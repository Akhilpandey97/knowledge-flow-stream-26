import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "All system users",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Exiting Employees",
      value: stats.exitingEmployees,
      description: "Users leaving",
      icon: UserCheck,
      color: "text-orange-600",
    },
    {
      title: "Successors", 
      value: stats.successors,
      description: "Taking over roles",
      icon: UserPlus,
      color: "text-green-600",
    },
    {
      title: "HR Managers",
      value: stats.hrManagers,
      description: "Managing handovers",
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      title: "Active Handovers",
      value: stats.activeHandovers,
      description: "In progress",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};