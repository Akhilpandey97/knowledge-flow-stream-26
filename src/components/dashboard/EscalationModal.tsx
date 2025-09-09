import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  HelpCircle, 
  Send,
  X,
  AlertTriangle
} from 'lucide-react';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!issue.trim() || !priority || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically send the escalation to your backend
    toast({
      title: "Request submitted successfully",
      description: "Your escalation has been sent to the HR manager. You'll receive a response within 24 hours.",
    });

    // Reset form and close
    setIssue('');
    setPriority('');
    setCategory('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-warning" />
            Request Manager Help
          </DialogTitle>
          <DialogDescription>
            Escalate concerns or request additional support for the handover process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Priority Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority Level *</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    Low - General question
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    Medium - Needs attention
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-critical"></div>
                    High - Urgent issue
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Issue Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missing-info">Missing Information</SelectItem>
                <SelectItem value="unclear-process">Unclear Process</SelectItem>
                <SelectItem value="access-issues">Access Issues</SelectItem>
                <SelectItem value="timeline-concerns">Timeline Concerns</SelectItem>
                <SelectItem value="resource-needs">Resource Needs</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <Label htmlFor="issue" className="text-sm font-medium">
              Describe the Issue *
            </Label>
            <Textarea
              id="issue"
              placeholder="Please provide detailed information about the issue you're experiencing, what help you need, and any relevant context..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* Warning Note */}
          <div className="bg-warning-soft border border-warning/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Important Note</p>
                <p className="text-muted-foreground">
                  This request will be sent to your HR manager and department head. 
                  For urgent issues, you may also contact them directly.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};