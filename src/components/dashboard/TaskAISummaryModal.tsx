import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { HandoverTask } from '@/types/handover';
import { supabase } from '@/integrations/supabase/client';

interface TaskAISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: HandoverTask | null;
  exitingEmployeeName?: string;
}

interface AISummary {
  insights: string;
  nextActionItems: string[];
  hasNextActions: boolean;
}

export const TaskAISummaryModal: React.FC<TaskAISummaryModalProps> = ({
  isOpen,
  onClose,
  task,
  exitingEmployeeName
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);

  const generateSummary = async () => {
    if (!task) return;

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-task-summary', {
        body: {
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            category: task.category,
            status: task.status,
            priority: task.priority,
            notes: task.notes,
            dueDate: task.dueDate
          },
          exitingEmployeeName
        }
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate summary');
      }

      if (data?.error) {
        if (data.error.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(data.error);
      }

      if (data?.summary) {
        setSummary(data.summary);
      } else {
        throw new Error('No summary returned from AI');
      }
    } catch (err: any) {
      console.error('Error generating AI summary:', err);
      setError(err.message || 'Failed to generate AI summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      generateSummary();
    } else {
      setSummary(null);
      setError(null);
    }
  }, [isOpen, task?.id]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-foreground">
                AI Insights
              </DialogTitle>
              <DialogDescription className="mt-1">
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm">Task:</span>
                  <Badge variant="outline" className="text-xs font-medium">
                    {task?.title}
                  </Badge>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
              </div>
              <p className="text-muted-foreground mt-4 text-sm">
                Generating AI summary...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                <p className="text-destructive font-medium mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={generateSummary}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {summary && (
            <>
              {/* Insights Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Key Insights
                  </h4>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <p className="text-foreground leading-relaxed">
                    {summary.insights}
                  </p>
                </div>
              </div>

              {/* Next Action Items Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Next Action Items
                  </h4>
                </div>
                
                {summary.hasNextActions && summary.nextActionItems.length > 0 ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                    <ul className="space-y-3">
                      {summary.nextActionItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-semibold text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-foreground leading-relaxed flex-1">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-muted/30 border border-border rounded-xl p-5 text-center">
                    <div className="flex items-center justify-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">No Further Actions Required</span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">
                      This task has been fully completed and handed over. You're all set!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Powered by AI
          </div>
          <div className="flex gap-2">
            {summary && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateSummary}
                disabled={loading}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </Button>
            )}
            <Button onClick={onClose} size="sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
