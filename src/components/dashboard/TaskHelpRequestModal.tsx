import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, HelpCircle, Loader2, Send } from 'lucide-react';
import { HandoverTask } from '@/types/handover';

interface TaskHelpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: HandoverTask | null;
  requestType: 'employee' | 'manager';
  onSubmit: (message: string) => Promise<void>;
  loading?: boolean;
}

export const TaskHelpRequestModal: React.FC<TaskHelpRequestModalProps> = ({
  isOpen,
  onClose,
  task,
  requestType,
  onSubmit,
  loading = false
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await onSubmit(message);
    setMessage('');
    onClose();
  };

  const isEmployee = requestType === 'employee';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEmployee ? 'bg-primary/10' : 'bg-warning/10'}`}>
              {isEmployee ? (
                <MessageCircle className="h-5 w-5 text-primary" />
              ) : (
                <HelpCircle className="h-5 w-5 text-warning" />
              )}
            </div>
            <div>
              <DialogTitle>
                {isEmployee ? 'Ask Employee' : 'Request Manager Help'}
              </DialogTitle>
              <DialogDescription>
                {isEmployee 
                  ? 'Send a question about this specific task to the exiting employee'
                  : 'Escalate this task to your manager for additional support'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            {/* Task Context */}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <p className="text-sm font-medium text-foreground">{task.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">{task.category}</Badge>
                <Badge 
                  variant={task.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {task.status}
                </Badge>
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isEmployee ? 'Your Question' : 'Describe the Issue'}
              </label>
              <Textarea
                placeholder={isEmployee 
                  ? 'What would you like to know about this task? Be specific about what information you need...'
                  : 'Describe the issue you need help with. What support do you need from your manager?'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!message.trim() || loading}
                className={isEmployee ? '' : 'bg-warning hover:bg-warning/90'}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send {isEmployee ? 'Question' : 'Escalation'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
