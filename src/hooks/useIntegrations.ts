import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Integration {
  id: string;
  user_id: string;
  integration_type: string;
  integration_name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useIntegrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIntegrations((data || []).map(integration => ({
        ...integration,
        status: integration.status as 'connected' | 'disconnected' | 'connecting',
        metadata: integration.metadata as Record<string, any> || {}
      })));
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectIntegration = async (integrationType: string, integrationName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect integrations",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if integration already exists
      const existingIntegration = integrations.find(
        (int) => int.integration_type === integrationType && int.user_id === user.id
      );

      if (existingIntegration) {
        toast({
          title: "Already Connected",
          description: `${integrationName} is already connected to your account`,
        });
        return;
      }

      // Call the appropriate integration edge function based on type
      let response;
      
      switch (integrationType) {
        case 'google-drive':
          response = await supabase.functions.invoke('connect-google-drive', {
            body: { userId: user.id }
          });
          break;
        case 'slack':
          response = await supabase.functions.invoke('connect-slack', {
            body: { userId: user.id }
          });
          break;
        case 'hubspot':
          response = await supabase.functions.invoke('connect-hubspot', {
            body: { userId: user.id }
          });
          break;
        default:
          throw new Error(`Integration type ${integrationType} not supported`);
      }

      if (response.error) throw response.error;

      // If the response contains an auth URL, redirect user
      if (response.data?.authUrl) {
        window.open(response.data.authUrl, '_blank', 'width=600,height=600');
        
        toast({
          title: "Authorization Required",
          description: `Please complete the authorization process for ${integrationName}`,
        });
      } else {
        // Direct connection successful
        await fetchIntegrations();
        
        // Log the activity
        await logActivity('integration_connected', 'integration', integrationType, {
          integration_name: integrationName,
          integration_type: integrationType
        });
        
        toast({
          title: "Connected Successfully",
          description: `${integrationName} has been connected to your account`,
        });
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect ${integrationName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const disconnectIntegration = async (integrationId: string, integrationName: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ status: 'disconnected' })
        .eq('id', integrationId);

      if (error) throw error;

      await fetchIntegrations();
      
      // Log the activity
      await logActivity('integration_disconnected', 'integration', integrationId, {
        integration_name: integrationName
      });
      
      toast({
        title: "Disconnected",
        description: `${integrationName} has been disconnected`,
      });
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect integration",
        variant: "destructive",
      });
    }
  };

  const logActivity = async (
    action: string, 
    resourceType: string, 
    resourceId: string, 
    details: Record<string, any> = {}
  ) => {
    try {
      await supabase.rpc('log_activity', {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const getIntegrationStatus = (integrationType: string) => {
    const integration = integrations.find(
      (int) => int.integration_type === integrationType && int.user_id === user?.id
    );
    return integration?.status || 'disconnected';
  };

  return {
    integrations,
    loading,
    connectIntegration,
    disconnectIntegration,
    getIntegrationStatus,
    fetchIntegrations
  };
};