import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Video, 
  Save,
  X
} from 'lucide-react';
import { HandoverTask } from '@/types/handover';

interface TaskDetailModalProps {
  task: HandoverTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, notes: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave
}) => {
  const [notes, setNotes] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  if (!task) return null;

  const handleSave = () => {
    if (notes.trim()) {
      onSave(task.id, notes);
      toast({
        title: "Notes saved successfully",
        description: "Your task notes have been updated.",
      });
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File selected",
        description: `${file.name} ready to upload`,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Task Details: {task.title}
          </DialogTitle>
          <DialogDescription>
            Add detailed notes, upload files, or record video explanations for this task.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Information */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={getPriorityColor(task.priority) as any}>
                {task.priority}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Category: {task.category}
              </span>
            </div>
            <p className="text-sm">{task.description}</p>
            {task.dueDate && (
              <p className="text-xs text-muted-foreground">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Existing Notes */}
          {task.notes && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Existing Notes</Label>
              <div className="bg-success-soft p-3 rounded border border-success/20">
                <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
              </div>
            </div>
          )}

          {/* Add New Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Add Detailed Notes
            </Label>
            <Textarea
              id="notes"
              placeholder={`Add comprehensive details about ${task.title}...`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Upload Documents</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Input
                type="file"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
              />
              {selectedFile && (
                <p className="text-sm text-success mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Video Link */}
          <div className="space-y-2">
            <Label htmlFor="video" className="text-sm font-medium">
              Video Recording Link (Optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="video"
                placeholder="Paste your video recording URL (Loom, YouTube, etc.)"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
              />
              <Button variant="outline" size="sm">
                <Video className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save & Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
