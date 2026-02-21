import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Sparkles, RefreshCw } from 'lucide-react';
import { useAIInsightConfig, AIInsightConfig } from '@/hooks/useAIInsightConfig';
import { toast } from '@/hooks/use-toast';
import { DEPARTMENTS } from '@/constants/departments';

interface EditableConfig extends AIInsightConfig {
  isEditing: boolean;
  isSaving: boolean;
}

export const AIInsightTitlesManager = () => {
  const { allConfigs, loading, error, fetchAllConfigs, updateConfig } = useAIInsightConfig();
  const [editableConfigs, setEditableConfigs] = useState<EditableConfig[]>([]);

  useEffect(() => {
    fetchAllConfigs();
  }, [fetchAllConfigs]);

  useEffect(() => {
    setEditableConfigs(
      allConfigs.map(config => ({
        ...config,
        isEditing: false,
        isSaving: false,
      }))
    );
  }, [allConfigs]);

  const handleInputChange = (configId: string, field: keyof AIInsightConfig, value: string) => {
    setEditableConfigs(prev =>
      prev.map(config =>
        config.id === configId
          ? { ...config, [field]: value, isEditing: true }
          : config
      )
    );
  };

  const handleSave = async (config: EditableConfig) => {
    setEditableConfigs(prev =>
      prev.map(c => (c.id === config.id ? { ...c, isSaving: true } : c))
    );

    try {
      await updateConfig(config.id, {
        revenue_title: config.revenue_title,
        playbook_title: config.playbook_title,
        critical_title: config.critical_title,
      });

      setEditableConfigs(prev =>
        prev.map(c =>
          c.id === config.id ? { ...c, isEditing: false, isSaving: false } : c
        )
      );

      toast({
        title: 'Configuration Saved',
        description: `AI insight titles for ${config.department} have been updated.`,
      });
    } catch (err: any) {
      console.error('Error saving config:', err);
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
      setEditableConfigs(prev =>
        prev.map(c => (c.id === config.id ? { ...c, isSaving: false } : c))
      );
    }
  };

  const handleReset = (configId: string) => {
    const originalConfig = allConfigs.find(c => c.id === configId);
    if (originalConfig) {
      setEditableConfigs(prev =>
        prev.map(c =>
          c.id === configId
            ? { ...originalConfig, isEditing: false, isSaving: false }
            : c
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load configurations: {error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchAllConfigs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Insight Section Titles
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure titles for AI insight sections on the Successor Dashboard and ChatGPT prompts.
        </p>
      </div>

      <div className="grid gap-6">
        {DEPARTMENTS.map(dept => {
          const config = editableConfigs.find(c => c.department === dept);
          
          if (!config) {
            return (
              <Card key={dept} className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">{dept}</CardTitle>
                  <CardDescription>No configuration found for this department.</CardDescription>
                </CardHeader>
              </Card>
            );
          }

          return (
            <Card key={dept} className={`glass-panel transition-all duration-150 ${config.isEditing ? 'ring-2 ring-primary/20 enterprise-shadow' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dept}</CardTitle>
                  <div className="flex items-center gap-2">
                    {config.isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReset(config.id)}
                        disabled={config.isSaving}
                      >
                        Reset
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSave(config)}
                      disabled={!config.isEditing || config.isSaving}
                    >
                      {config.isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`${config.id}-revenue`}>Revenue/Performance Section Title</Label>
                  <Input
                    id={`${config.id}-revenue`}
                    value={config.revenue_title}
                    onChange={(e) => handleInputChange(config.id, 'revenue_title', e.target.value)}
                    placeholder="e.g., Revenue Growth & Retention"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${config.id}-playbook`}>Playbook Section Title</Label>
                  <Input
                    id={`${config.id}-playbook`}
                    value={config.playbook_title}
                    onChange={(e) => handleInputChange(config.id, 'playbook_title', e.target.value)}
                    placeholder="e.g., AI Successor Playbook"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${config.id}-critical`}>Critical Items Section Title</Label>
                  <Input
                    id={`${config.id}-critical`}
                    value={config.critical_title}
                    onChange={(e) => handleInputChange(config.id, 'critical_title', e.target.value)}
                    placeholder="e.g., Critical & Priority AI Insights"
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
