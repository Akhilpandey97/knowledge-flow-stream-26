import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DocumentUploadScreenProps {
  onUploadComplete: () => void;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload documents.',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload file to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('handover-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Record the upload in database
      const { error: dbError } = await supabase
        .from('user_document_uploads')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: data.path,
        });

      if (dbError) throw dbError;

      setUploadProgress(75);

      // Send document content via webhook
      const { error: webhookError } = await supabase.functions.invoke('send-document-webhook', {
        body: { 
          filePath: data.path,
          fileName: file.name,
          userId: user.id 
        }
      });

      if (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the upload if webhook fails, just log it
        toast({
          title: 'Upload Complete',
          description: 'Document uploaded successfully. Webhook notification may have failed.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Upload Complete',
          description: 'Document uploaded and processed successfully.',
        });
      }

      setUploadProgress(100);
      
      // Wait a moment to show completion
      setTimeout(() => {
        onUploadComplete();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Upload Knowledge Transfer Document</CardTitle>
          <CardDescription>
            Please upload your knowledge transfer document to begin the handover process.
            This document will be processed and shared with relevant stakeholders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!uploading ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Your Document</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Supported formats: PDF, DOC, DOCX, TXT (Max 20MB)
              </p>
              <Button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.txt';
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(files);
                  };
                  input.click();
                }}
                className="w-full max-w-xs"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Processing Your Document</h3>
                <p className="text-muted-foreground">
                  Please wait while we upload and process your document...
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>

              {uploadProgress === 100 && (
                <Alert className="border-success bg-success/5">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    Document uploaded successfully! Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};