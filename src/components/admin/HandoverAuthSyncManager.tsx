import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface HandoverSyncResult {
  success: boolean;
  updated_handovers: number;
  message: string;
}

export const HandoverAuthSyncManager: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<HandoverSyncResult | null>(null);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      // Note: RPC function temporarily disabled due to migration
      // TODO: Re-implement admin_sync_handover_auth_ids function
      
      const result: HandoverSyncResult = {
        success: true,
        updated_handovers: 0,
        message: "Sync functionality temporarily unavailable due to database migration"
      };
      
      setLastSyncResult(result);
      
      toast({
        title: "Sync Notice",
        description: "Sync functionality is temporarily disabled during database migration",
        variant: "default",
      });
      
    } catch (err: unknown) {
      console.error('Unexpected sync error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during sync';
      toast({
        title: "Sync Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Handover Auth ID Sync
        </CardTitle>
        <CardDescription>
          Ensure all handovers reference correct Supabase Auth IDs instead of public profile IDs.
          This tool fixes mismatched references between the handovers table and user authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Manual Sync</p>
            <p className="text-xs text-muted-foreground">
              Trigger a manual synchronization of handover Auth IDs
            </p>
          </div>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        {lastSyncResult && (
          <div className={`p-3 rounded-lg border ${
            lastSyncResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {lastSyncResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {lastSyncResult.success ? 'Sync Successful' : 'Sync Failed'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSyncResult.message}
                </p>
                {lastSyncResult.success && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {lastSyncResult.updated_handovers} handover record(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Identifies handovers referencing outdated user IDs</li>
            <li>Updates handover records to use correct Supabase Auth IDs</li>
            <li>Ensures consistency between user authentication and handover associations</li>
            <li>Fixes issues where users can't see their handovers due to ID mismatches</li>
          </ul>
          
          <p className="mt-3"><strong>When to use:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>After importing legacy user data</li>
            <li>When users report missing handovers</li>
            <li>After manual user ID corrections</li>
            <li>During system maintenance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};