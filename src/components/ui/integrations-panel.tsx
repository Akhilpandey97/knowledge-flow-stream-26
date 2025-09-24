import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  MessageSquare, 
  Building, 
  Mail,
  Calendar,
  FileText,
  Database,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useIntegrations } from '@/hooks/useIntegrations';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'available' | 'coming-soon';
  category: 'storage' | 'communication' | 'crm' | 'productivity';
}

const integrations: Integration[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Sync documents and files automatically',
    icon: Cloud,
    status: 'available',
    category: 'storage'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to channels',
    icon: MessageSquare,
    status: 'available',
    category: 'communication'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Import contacts and deal information',
    icon: Building,
    status: 'available',
    category: 'crm'
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Calendar integration and email notifications',
    icon: Mail,
    status: 'connected',
    category: 'communication'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Export knowledge base to Notion pages',
    icon: FileText,
    status: 'coming-soon',
    category: 'productivity'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Import customer and opportunity data',
    icon: Database,
    status: 'coming-soon',
    category: 'crm'
  }
];

export const IntegrationsPanel: React.FC = () => {
  const { toast } = useToast();
  const { connectIntegration, disconnectIntegration, getIntegrationStatus, loading } = useIntegrations();

  const handleConnect = async (integration: Integration) => {
    if (integration.status === 'coming-soon') {
      toast({
        title: 'Coming Soon',
        description: `${integration.name} integration is in development. We'll notify you when it's ready!`,
      });
      return;
    }

    const currentStatus = getIntegrationStatus(integration.id);
    
    if (currentStatus === 'connected') {
      toast({
        title: 'Already Connected',
        description: `${integration.name} is already connected to your account.`,
      });
      return;
    }

    await connectIntegration(integration.id, integration.name);
  };

  const getStatusBadge = (integration: Integration) => {
    const currentStatus = getIntegrationStatus(integration.id);
    
    if (integration.status === 'coming-soon') {
      return <Badge variant="secondary" className="text-xs">Coming Soon</Badge>;
    }
    
    switch (currentStatus) {
      case 'connected':
        return <Badge variant="secondary" className="text-success bg-success-soft border-success text-xs">Connected</Badge>;
      case 'connecting':
        return <Badge variant="outline" className="text-warning text-xs">Connecting...</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Available</Badge>;
    }
  };

  const getCategoryIcon = (category: Integration['category']) => {
    switch (category) {
      case 'storage': return Cloud;
      case 'communication': return MessageSquare;
      case 'crm': return Building;
      case 'productivity': return FileText;
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Integrations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border rounded-lg p-4 hover:shadow-soft transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-soft rounded-lg">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{integration.name}</h4>
                    </div>
                  </div>
                  {getStatusBadge(integration)}
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  {integration.description}
                </p>
                
                <Button
                  variant={getIntegrationStatus(integration.id) === 'connected' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleConnect(integration)}
                  className="w-full"
                  disabled={integration.status === 'coming-soon' || loading}
                >
                  {getIntegrationStatus(integration.id) === 'connected' && 'Manage'}
                  {getIntegrationStatus(integration.id) === 'connecting' && 'Connecting...'}
                  {getIntegrationStatus(integration.id) === 'disconnected' && integration.status === 'available' && 'Connect'}
                  {integration.status === 'coming-soon' && 'Coming Soon'}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};