import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  User, 
  UserPlus, 
  Settings, 
  FileText, 
  Link,
  Shield,
  RefreshCw,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLogEntry {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const ActivityLog = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setActivities((data || []).map(activity => ({
        ...activity,
        details: activity.details as Record<string, any> || {},
        ip_address: activity.ip_address as string || undefined,
        user_agent: activity.user_agent as string || undefined,
        resource_id: activity.resource_id as string || undefined,
        resource_type: activity.resource_type as string || undefined,
        user_id: activity.user_id as string || undefined
      })));
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activity log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'user_created':
      case 'user_signup':
        return UserPlus;
      case 'user_login':
      case 'user_logout':
        return User;
      case 'handover_created':
      case 'handover_updated':
        return FileText;
      case 'integration_connected':
      case 'integration_disconnected':
        return Link;
      case 'admin_action':
        return Shield;
      case 'settings_updated':
        return Settings;
      default:
        return Activity;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'user_created':
      case 'handover_created':
      case 'integration_connected':
        return 'default';
      case 'user_login':
        return 'secondary';
      case 'user_logout':
      case 'integration_disconnected':
        return 'outline';
      case 'admin_action':
      case 'settings_updated':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatActionText = (activity: ActivityLogEntry) => {
    const action = activity.action.toLowerCase();
    const details = activity.details || {};
    
    switch (action) {
      case 'user_created':
        return `New user created: ${details.email || 'Unknown'}`;
      case 'user_login':
        return `User logged in: ${details.email || 'Unknown'}`;
      case 'user_logout':
        return `User logged out: ${details.email || 'Unknown'}`;
      case 'handover_created':
        return `New handover created for ${details.employee_email || 'employee'}`;
      case 'handover_updated':
        return `Handover updated: ${details.title || 'Unknown handover'}`;
      case 'integration_connected':
        return `Connected to ${details.integration_name || 'integration'}`;
      case 'integration_disconnected':
        return `Disconnected from ${details.integration_name || 'integration'}`;
      case 'admin_action':
        return `Admin action performed: ${details.action || 'Unknown'}`;
      case 'settings_updated':
        return `System settings updated: ${details.setting || 'Unknown'}`;
      default:
        return activity.action.replace(/_/g, ' ');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Activity Log
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity logs found</p>
            <p className="text-sm">System activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity, index) => {
              const ActionIcon = getActionIcon(activity.action);
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 bg-primary-soft rounded-full">
                    <ActionIcon className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {formatActionText(activity)}
                      </p>
                      <Badge variant={getActionVariant(activity.action)} className="text-xs">
                        {activity.action.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                      {activity.ip_address && (
                        <>
                          <span>•</span>
                          <span>IP: {activity.ip_address}</span>
                        </>
                      )}
                    </div>
                    
                    {Object.keys(activity.details || {}).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          View details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};