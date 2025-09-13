import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IntegrationsPanel } from '@/components/ui/integrations-panel';

export const IntegrationsManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Integrations</CardTitle>
        <CardDescription>
          Manage third-party integrations and system connections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IntegrationsPanel />
      </CardContent>
    </Card>
  );
};