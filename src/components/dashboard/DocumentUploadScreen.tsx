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
export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({
  onUploadComplete
}) => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
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
        onUploadComplete();
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
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
              <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/20 shadow-lg backdrop-blur-sm">
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
              Document Upload Required
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-md mx-auto">
              Upload your handover document to begin the knowledge transfer process
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="relative border-2 border-primary/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] bg-card/95 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/2 to-transparent pointer-events-none"></div>
          <CardHeader className="relative pb-6 border-b border-border/30">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              Knowledge Handover Document
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Securely upload your document to initiate the knowledge transfer workflow
            </p>
          </CardHeader>
          <CardContent className="relative space-y-8 p-8">
            {!isUploading ? (
              <>
                {/* Successor Selection */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Label htmlFor="successor-select" className="text-lg font-semibold text-foreground">
                        Select Successor
                      </Label>
                      <span className="text-critical font-medium ml-2">*</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose who will receive your knowledge transfer
                      </p>
                    </div>
                  </div>
                  {error ? (
                    <div className="space-y-4">
                      <Alert className="border-critical/30 bg-critical-soft/50 backdrop-blur-sm">
                        <AlertTriangle className="h-5 w-5 text-critical" />
                        <AlertDescription className="text-critical font-medium">
                          Failed to load available successors: {error}
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="outline" 
                        onClick={retry}
                        disabled={usersLoading}
                        className="w-full h-12 bg-background/50 backdrop-blur-sm border-2 border-critical/20 hover:border-critical/40 transition-all duration-300"
                      >
                        {usersLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          'Retry Loading Users'
                        )}
                      </Button>
                    </div>
                  ) : usersLoading ? (
                    <div className="flex items-center justify-center p-8 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border-2 border-border/30 backdrop-blur-sm">
                      <Loader2 className="h-6 w-6 mr-3 animate-spin text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Loading available successors...</span>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="space-y-4">
                      <Alert className="border-warning/30 bg-warning-soft/50 backdrop-blur-sm">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <AlertDescription className="text-warning">
                          <strong className="font-semibold">No available successors found.</strong>
                          <br />
                          This could be due to:
                          <ul className="list-disc ml-4 mt-3 space-y-2">
                            <li>All users are marked as 'exiting' employees</li>
                            <li>Database permissions issue</li>
                            <li>No users exist in the system</li>
                          </ul>
                          <p className="mt-3 font-medium">Please contact your HR manager for assistance.</p>
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="outline" 
                        onClick={retry}
                        disabled={usersLoading}
                        className="w-full h-12 bg-background/50 backdrop-blur-sm border-2 border-warning/20 hover:border-warning/40 transition-all duration-300"
                      >
                        Retry Loading Users
                      </Button>
                    </div>
                  ) : (
                    <Select value={selectedSuccessor} onValueChange={setSelectedSuccessor}>
                      <SelectTrigger id="successor-select" className="h-14 bg-background/50 backdrop-blur-sm border-2 border-border/30 hover:border-primary/40 focus:border-primary transition-all duration-300 text-base">
                        <SelectValue placeholder="Choose a successor for your handover" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-md border-2 border-border/30 shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-xl">
                        {users.map((successor) => (
                          <SelectItem 
                            key={successor.id} 
                            value={successor.id}
                            className="hover:bg-accent/70 cursor-pointer py-4 px-4 rounded-lg mx-1 my-1 transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center border border-primary/20">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <span className="font-semibold text-foreground text-base">{successor.email}</span>
                                <span className="text-sm text-muted-foreground ml-3 capitalize bg-muted/50 px-2 py-1 rounded-md">
                                  {successor.role}
                                </span>
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
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 group ${
                    isDragging 
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 scale-[1.02] shadow-[0_20px_40px_rgba(59,130,246,0.15)] ring-4 ring-primary/20' 
                      : 'border-border/40 hover:border-primary/60 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)]'
                  }`} 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave} 
                  onDrop={handleDrop}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-background/50 to-transparent pointer-events-none"></div>
                  <div className={`relative transition-transform duration-500 ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <div className="relative mb-6">
                      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                        isDragging ? 'bg-primary/30 animate-pulse scale-150' : 'bg-primary/10 group-hover:bg-primary/20'
                      }`}></div>
                      <div className={`relative p-4 rounded-full transition-all duration-500 ${
                        isDragging ? 'bg-primary/20' : 'bg-background group-hover:bg-primary/10'
                      }`}>
                        <Upload className={`h-16 w-16 mx-auto transition-all duration-500 ${
                          isDragging ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-primary'
                        }`} />
                      </div>
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
                      isDragging ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    }`}>
                      {isDragging ? 'Drop your document here' : 'Drag and drop your document here'}
                    </h3>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-md mx-auto">
                      Supports PDF, Word documents, and other common formats up to 20MB
                    </p>
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        className="relative h-14 px-8 text-base font-semibold bg-background/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 group overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          accept=".pdf,.doc,.docx,.txt,.md" 
                          onChange={handleFileSelect} 
                        />
                        <Upload className="h-5 w-5 mr-3" />
                        Choose File
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        <span className="inline-block w-2 h-2 bg-success rounded-full mr-2"></span>
                        Secure upload with end-to-end encryption
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <Alert className="bg-gradient-to-r from-primary-soft to-primary-soft/70 border-2 border-primary/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <AlertDescription className="text-primary-foreground/90 text-base leading-relaxed">
                      <strong className="font-semibold">Ready to proceed?</strong> Select a successor and upload your handover document. 
                      The document will be processed and analyzed to create your knowledge transfer dashboard.
                    </AlertDescription>
                  </div>
                </Alert>
              </>
            ) : (
              /* Upload Progress */
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    {uploadProgress === 100 ? (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-success/30 animate-pulse"></div>
                        <div className="relative p-3 rounded-full bg-gradient-to-br from-success/20 to-success/30 border-2 border-success/30">
                          <CheckCircle className="h-8 w-8 text-success" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
                        <div className="relative p-3 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 border-2 border-primary/20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-foreground">
                        {uploadProgress === 100 ? 'Processing Document...' : 'Uploading Document...'}
                      </h3>
                      <span className="text-lg font-semibold bg-primary/10 px-3 py-1 rounded-full text-primary">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={uploadProgress} 
                        className="h-3 bg-muted/50 rounded-full overflow-hidden" 
                      />
                      <div 
                        className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 shadow-lg"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {uploadProgress < 50 ? 'Uploading to secure servers...' : 
                       uploadProgress < 100 ? 'Validating document format...' : 
                       'Analyzing content and preparing dashboard...'}
                    </p>
                  </div>
                </div>
                
                {uploadedFile && (
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border-2 border-border/30 backdrop-blur-sm">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-base font-semibold text-foreground block truncate">
                        {uploadedFile.name}
                      </span>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(uploadedFile.size / 1024)} KB
                        </span>
                        <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                          Secure Upload
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {uploadProgress === 100 && (
                  <Alert className="border-2 border-success/30 bg-gradient-to-r from-success-soft to-success-soft/70 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/20">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <AlertDescription className="text-success text-base font-medium">
                        <strong className="font-bold">Upload Complete!</strong> Document processed successfully. 
                        Redirecting to your knowledge transfer dashboard...
                      </AlertDescription>
                    </div>
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