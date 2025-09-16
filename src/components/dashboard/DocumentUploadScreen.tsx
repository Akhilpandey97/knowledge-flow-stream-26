import React, { useState, useCallback, Suspense } from 'react';
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
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Lazy load ExitingEmployeeDashboard to break circular dependency
const ExitingEmployeeDashboard = React.lazy(() => import('./ExitingEmployeeDashboard'));
interface DocumentUploadScreenProps {
  onUploadComplete?: () => void;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({
  onUploadComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    users,
    loading: usersLoading,
    error,
    retry
  } = useUsers();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedSuccessor, setSelectedSuccessor] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState(false);
  
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('Starting file upload process...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    if (!user) {
      console.error('No user found for upload');
      toast({
        title: "Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive"
      });
      return;
    }

    console.log('Current user:', { id: user.id, email: user.email });

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
      console.error('Successor validation failed:', {
        selectedSuccessor,
        error,
        usersLoading,
        usersCount: users.length
      });
      toast({
        title: "Successor Required",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    console.log('Selected successor:', selectedSuccessor);

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      console.error('File too large:', file.size);
      toast({
        title: "File too large",
        description: "Please select a file smaller than 20MB.",
        variant: "destructive"
      });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadedFile(file);
    try {
      // Create file path with user ID
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      console.log('Upload file path:', filePath);

      // Upload file to Supabase Storage
      console.log('Starting Supabase storage upload...');
      const {
        data,
        error: uploadError
      } = await supabase.storage.from('handover-documents').upload(filePath, file);

      console.log('Supabase storage upload result:', { data, uploadError });

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
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      setUploadProgress(100);

      // Record upload in database
      console.log('Recording upload in database...');
      const {
        error: dbError
      } = await supabase.from('user_document_uploads').insert({
        user_id: user.id,
        filename: file.name,
        file_path: filePath
      });
      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      console.log('Database record created successfully');

      // Find or create handover for this user (as exiting employee)
      let handoverId: string | null = null;
      console.log('Finding/creating handover record...');
      const {
        data: existingHandover
      } = await supabase.from('handovers').select('id').eq('employee_id', user.id).limit(1).maybeSingle();
      
      console.log('Existing handover:', existingHandover);
      
      if (existingHandover) {
        // Update existing handover with successor
        handoverId = existingHandover.id;
        console.log('Updating existing handover with successor...');
        const {
          error: updateError
        } = await supabase.from('handovers').update({
          successor_id: selectedSuccessor
        }).eq('id', handoverId);
        if (updateError) {
          console.error('Error updating handover:', updateError);
        } else {
          console.log('Handover updated successfully');
        }
      } else {
        // Create new handover with successor
        console.log('Creating new handover...');
        const {
          data: newHandover,
          error: createError
        } = await supabase.from('handovers').insert({
          employee_id: user.id,
          successor_id: selectedSuccessor,
          progress: 0
        }).select('id').single();
        if (createError) {
          console.error('Error creating handover:', createError);
        } else {
          handoverId = newHandover?.id;
          console.log('New handover created:', handoverId);
        }
      }

      // Send document content via webhook with user and handover context
      console.log('Invoking webhook...');
      const {
        error: webhookError
      } = await supabase.functions.invoke('send-document-webhook', {
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
      } else {
        console.log('Webhook invoked successfully');
      }
      
      console.log('Upload process completed successfully');
      toast({
        title: "Document uploaded successfully",
        description: "Your document has been uploaded and processed."
      });

      // Wait a moment for user to see success, then proceed
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete();
        } else {
          // Only show dashboard if no callback provided
          setShowDashboard(true);
        }
      }, 2000);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document. Please try again.";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      setIsUploading(false);
      setUploadProgress(0);
      setUploadedFile(null);
    }
  }, [user, selectedSuccessor, error, usersLoading, users.length, toast, onUploadComplete]);

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
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Show dashboard after successful upload
  if (showDashboard) {
    return (
      <ErrorBoundary>
        <Suspense 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-lg font-medium text-muted-foreground">Loading dashboard...</span>
              </div>
            </div>
          }
        >
          <ExitingEmployeeDashboard />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Document Upload Required
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Upload your handover document to begin the knowledge transfer process
          </p>
        </div>

        {/* Upload Card */}
        <Card className="border-border/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-foreground">
              Knowledge Handover Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isUploading ? (
              <>
                {/* Successor Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <Label htmlFor="successor-select" className="text-sm font-medium text-foreground">
                      Select Successor
                    </Label>
                    <span className="text-sm text-critical">*</span>
                  </div>
                  {error ? (
                    <div className="space-y-3">
                      <Alert className="border-critical/20 bg-critical-soft">
                        <AlertTriangle className="h-4 w-4 text-critical" />
                        <AlertDescription className="text-critical">
                          Failed to load available successors: {error}
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="outline" 
                        onClick={retry}
                        disabled={usersLoading}
                        className="w-full h-10"
                      >
                        {usersLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          'Retry Loading Users'
                        )}
                      </Button>
                    </div>
                  ) : usersLoading ? (
                    <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg border border-border/50">
                      <Loader2 className="h-5 w-5 mr-3 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading available successors...</span>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="space-y-3">
                      <Alert className="border-warning/20 bg-warning-soft">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <AlertDescription className="text-warning">
                          No available successors found. This could be due to:
                          <ul className="list-disc ml-4 mt-2 space-y-1">
                            <li>All users are marked as 'exiting' employees</li>
                            <li>Database permissions issue</li>
                            <li>No users exist in the system</li>
                          </ul>
                          Please contact your HR manager for assistance.
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="outline" 
                        onClick={retry}
                        disabled={usersLoading}
                        className="w-full h-10"
                      >
                        Retry Loading Users
                      </Button>
                    </div>
                  ) : (
                    <Select value={selectedSuccessor} onValueChange={setSelectedSuccessor}>
                      <SelectTrigger id="successor-select" className="h-12 bg-background border-border/50 hover:border-border transition-colors">
                        <SelectValue placeholder="Choose a successor for your handover" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border/50 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                        {users.map((successor) => (
                          <SelectItem 
                            key={successor.id} 
                            value={successor.id}
                            className="hover:bg-accent/50 cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="font-medium text-foreground">{successor.email}</span>
                                <span className="text-xs text-muted-foreground ml-2 capitalize">({successor.role})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {/* Drag and Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-[1.02] shadow-[0_0_20px_rgba(var(--primary),0.15)]' 
                      : 'border-border/30 hover:border-primary/50 hover:bg-muted/30'
                  }`} 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave} 
                  onDrop={handleDrop}
                >
                  <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      Drag and drop your document here
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Supports PDF, Word documents, and other common formats
                    </p>
                    <div className="space-y-3">
                      <Button variant="outline" className="relative h-10 px-6">
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
                </div>

                {/* Instructions */}
                <Alert className="bg-primary-soft border-primary/20">
                  <FileText className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary-foreground/80">
                    Select a successor and upload your handover document. The document will be processed 
                    and analyzed to create your knowledge transfer dashboard.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              /* Upload Progress */
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {uploadProgress === 100 ? (
                      <div className="p-2 rounded-full bg-success/10">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-primary/10">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-foreground">
                        {uploadProgress === 100 ? 'Processing Document...' : 'Uploading Document...'}
                      </p>
                      <span className="text-sm font-medium text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <Progress 
                      value={uploadProgress} 
                      className="h-2 bg-muted" 
                    />
                  </div>
                </div>
                
                {uploadedFile && (
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border/30">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground block truncate">
                        {uploadedFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(uploadedFile.size / 1024)} KB
                      </span>
                    </div>
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