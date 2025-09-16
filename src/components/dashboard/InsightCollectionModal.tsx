import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HandoverTask {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}

interface InsightCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: HandoverTask | null;
  onSaveAndNext: (taskId: string, insights: string, file?: File) => void;
}

export const InsightCollectionModal: React.FC<InsightCollectionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveAndNext
}) => {
  const [insights, setInsights] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSaveAndNext = () => {
    if (task && insights.trim()) {
      onSaveAndNext(task.id, insights, selectedFile || undefined);
      setInsights('');
      setSelectedFile(null);
      onClose();
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Share Your Insights - {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Task Context */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              <p className="text-xs text-gray-500">Category: {task.category}</p>
            </CardContent>
          </Card>

          {/* Insights Input */}
          <div className="space-y-2">
            <Label htmlFor="insights" className="text-sm font-medium">
              Share your insights and knowledge about this task *
            </Label>
            <Textarea
              id="insights"
              placeholder="Share key insights, important contacts, processes, tips, or anything that would help your successor with this task..."
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Supporting Documents (optional)
            </Label>
            
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: PDF, DOC, DOCX, TXT, Images
                </p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Browse Files
                </Button>
              </div>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndNext}
              disabled={!insights.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save & Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};