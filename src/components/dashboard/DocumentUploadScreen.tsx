import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, Loader2, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useUsers } from '@/hooks/useUsers';

interface DocumentUploadScreenProps {
  onUploadComplete: () => void;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { users, loading: usersLoading, error, retry } = useUsers();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedSuccessor, setSelectedSuccessor] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    // Validate successor selection
    if (!selectedSuccessor) {
      let errorMessage = "Please select a successor before uploading your handover document.";
      
      if (error) {
        errorMessage = "Unable to load available successors. Please retry loading users first.";
      } else if (usersLoading) {
        errorMessage = "Still loading available successors. Please wait a moment and try again.";
      } else if (users.length === 0) {
        errorMessage = "No available successors found. Please contact your HR manager.";
      }
      
      toast({
        title: "Successor Required",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFile(file);

    try {
      // Create file path with user ID
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // Upload file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('handover-documents')
        .upload(filePath, file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      if (uploadError) {
        clearInterval(progressInterval);
        throw uploadError;
      }

      setUploadProgress(100);

      // Record upload in database
      const { error: dbError } = await supabase
        .from('user_document_uploads')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: filePath
        });

      if (dbError) {
        throw dbError;
      }

      // Find or create handover for this user (as exiting employee)
      let handoverId: string | null = null;
      const { data: existingHandover } = await supabase
        .from('handovers')
        .select('id')
        .eq('employee_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existingHandover) {
        // Update existing handover with successor
        handoverId = existingHandover.id;
        const { error: updateError } = await supabase
          .from('handovers')
          .update({ successor_id: selectedSuccessor })
          .eq('id', handoverId);
        
        if (updateError) {
          console.error('Error updating handover:', updateError);
        }
      } else {
        // Create new handover with successor
        const { data: newHandover, error: createError } = await supabase
          .from('handovers')
          .insert({
            employee_id: user.id,
            successor_id: selectedSuccessor,
            progress: 0
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating handover:', createError);
        } else {
          handoverId = newHandover?.id;
        }
      }

      // Send document content via webhook with user and handover context
      const { error: webhookError } = await supabase.functions.invoke('send-document-webhook', {
        body: { 
          filePath, 
          filename: file.name,
          userId: user.id,
          handoverId: handoverId
        }
      });

      if (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the upload if webhook fails, just log it
      }

      toast({
        title: "Document uploaded successfully",
        description: "Your document has been uploaded and processed.",
      });

      // Wait a moment for user to see success, then proceed
      setTimeout(() => {
        onUploadComplete();
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
      setUploadedFile(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Document Upload Required</h1>
          <p className="text-muted-foreground text-lg">
            Please upload your handover document to proceed to the dashboard.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Your Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isUploading ? (
              <>
                {/* Successor Selection */}
                <div className="space-y-3">
                  <Label htmlFor="successor-select" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Successor *
                  </Label>
                  
                  {/* Error state with retry option */}
                  {error && !loading && (
                    <Alert className="border-destructive/20 bg-destructive-soft">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <div className="flex items-center justify-between">
                          <span>Failed to load users: {error}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={retry}
                            className="ml-2"
                          >
                            Retry
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Select 
                    value={selectedSuccessor} 
                    onValueChange={setSelectedSuccessor}
                    disabled={usersLoading || !!error}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue 
                        placeholder={
                          usersLoading 
                            ? "Loading users..." 
                            : error 
                            ? "Please retry to load users"
                            : users.length === 0
                            ? "No available users found"
                            : "Choose a successor for your handover"
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!usersLoading && !error && users.length > 0 && users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.email}</span>
                            <span className="text-xs text-muted-foreground capitalize">{user.role.replace('-', ' ')}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {!usersLoading && !error && users.length === 0 && (
                        <SelectItem value="no-users" disabled>
                          No available users found
                        </SelectItem>
                      )}
                      {usersLoading && (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading users...
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {!selectedSuccessor && !error && (
                    <p className="text-xs text-muted-foreground">
                      A successor must be selected to receive and continue your responsibilities
                    </p>
                  )}
                  
                  {/* Additional info when no users are available */}
                  {!usersLoading && !error && users.length === 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No available successors found. Please contact your HR manager to ensure there are eligible users in the system.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                {/* Drag and Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-105'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/10'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Drag and drop your document here</h3>
                  <p className="text-muted-foreground mb-4">
                    Supports PDF, Word documents, and other common formats
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="relative">
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileSelect}
                      />
                      Choose File
                    </Button>
                    <p className="text-xs text-muted-foreground">Maximum file size: 20MB</p>
                  </div>
                </div>

                {/* Instructions */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please select a successor and upload your handover document. Once uploaded, your document will be processed and sent for analysis. 
                    You'll then be able to access your knowledge handover dashboard.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              /* Upload Progress */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {uploadProgress === 100 ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">
                        {uploadProgress === 100 ? 'Processing...' : 'Uploading...'}
                      </p>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                </div>
                
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {Math.round(uploadedFile.size / 1024)} KB
                    </span>
                  </div>
                )}

                {uploadProgress === 100 && (
                  <Alert className="border-success/20 bg-success-soft">
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
    </div>
  );
};