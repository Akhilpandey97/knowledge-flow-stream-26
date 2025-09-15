import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, Loader2, AlertTriangle, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Demo component to show the fixed functionality
export const DemoDocumentUpload: React.FC = () => {
  const { toast } = useToast();
  const [selectedSuccessor, setSelectedSuccessor] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [simulateError, setSimulateError] = useState(false);
  const [simulateNoSuccessors, setSimulateNoSuccessors] = useState(false);

  // Mock successors data to demonstrate the fix
  const mockSuccessors = simulateNoSuccessors ? [] : [
    {
      id: 'successor-1',
      email: 'alice.smith@company.com',
      role: 'successor'
    },
    {
      id: 'successor-2',
      email: 'bob.johnson@company.com',
      role: 'hr-manager'
    },
    {
      id: 'successor-3',
      email: 'carol.davis@company.com',
      role: 'successor'
    }
  ];

  const handleDemoUpload = async () => {
    if (!selectedSuccessor && !simulateNoSuccessors) {
      toast({
        title: "Successor Required",
        description: "Please select a successor before uploading your handover document.",
        variant: "destructive"
      });
      return;
    }

    if (simulateNoSuccessors) {
      toast({
        title: "Successor Required",
        description: "No available successors found. Please contact your HR manager.",
        variant: "destructive"
      });
      return;
    }

    if (simulateError) {
      toast({
        title: "Upload failed",
        description: "Simulated error: Network connection failed",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast({
            title: "Document uploaded successfully",
            description: "Your document has been uploaded and processed."
          });
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">📋 Demo: Fixed Document Upload</h1>
          <p className="text-muted-foreground text-lg">
            This demonstrates the fixes for successor loading and document upload functionality.
          </p>
        </div>

        {/* Demo Controls */}
        <Card className="shadow-elegant border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Demo Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                variant={simulateNoSuccessors ? "destructive" : "outline"}
                onClick={() => setSimulateNoSuccessors(!simulateNoSuccessors)}
                size="sm"
              >
                {simulateNoSuccessors ? "✅ No Successors Mode" : "❌ Enable No Successors"}
              </Button>
              <Button
                variant={simulateError ? "destructive" : "outline"}
                onClick={() => setSimulateError(!simulateError)}
                size="sm"
              >
                {simulateError ? "✅ Error Mode" : "❌ Enable Upload Error"}
              </Button>
            </div>
            <Alert>
              <AlertDescription>
                Use these controls to test different scenarios and see how the improved error handling works.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

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
                  <Label htmlFor="successor-select" className="text-sm font-semibold text-foreground">
                    Select Successor *
                  </Label>
                  {simulateNoSuccessors ? (
                    <div className="space-y-2">
                      <Alert className="border-warning/20 bg-warning/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-warning">
                          No available successors found. This could be due to:
                          <ul className="list-disc ml-4 mt-2">
                            <li>All users are marked as 'exiting' employees</li>
                            <li>Database permissions issue</li>
                            <li>No users exist in the system</li>
                          </ul>
                          Please contact your HR manager for assistance.
                        </AlertDescription>
                      </Alert>
                      <Button 
                        variant="outline" 
                        onClick={() => setSimulateNoSuccessors(false)}
                        className="w-full"
                      >
                        🔄 Retry Loading Users
                      </Button>
                    </div>
                  ) : (
                    <Select value={selectedSuccessor} onValueChange={setSelectedSuccessor}>
                      <SelectTrigger id="successor-select" className="h-12 bg-background">
                        <SelectValue placeholder="Choose a successor for your handover" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border shadow-lg z-50">
                        {mockSuccessors.map((successor) => (
                          <SelectItem 
                            key={successor.id} 
                            value={successor.id}
                            className="hover:bg-muted cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="font-medium">{successor.email}</span>
                                <span className="text-xs text-muted-foreground ml-2 capitalize">({successor.role})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {/* Upload Demo */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center border-primary/50 bg-primary/5">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">Demo Document Upload</h3>
                  <p className="text-muted-foreground mb-4">
                    Click below to simulate a document upload
                  </p>
                  <Button onClick={handleDemoUpload} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Simulate Upload
                  </Button>
                </div>

                {/* Features Fixed */}
                <Alert className="border-success/20 bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    <strong>✅ Issues Fixed:</strong>
                    <ul className="list-disc ml-4 mt-2">
                      <li>Added missing `is_admin` function in Supabase</li>
                      <li>Fixed `list_successor_candidates` RPC function</li>
                      <li>Added fallback mechanism for user loading</li>
                      <li>Enhanced error handling and user feedback</li>
                      <li>Improved successor selection validation</li>
                      <li>Added detailed console logging for debugging</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              /* Upload Progress */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {uploadProgress === 100 ? 
                    <CheckCircle className="h-5 w-5 text-success" /> : 
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  }
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">
                        {uploadProgress === 100 ? 'Processing...' : 'Uploading...'}
                      </p>
                      <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">demo-handover-document.pdf</span>
                  <span className="text-xs text-muted-foreground ml-auto">1.2 MB</span>
                </div>

                {uploadProgress === 100 && (
                  <Alert className="border-success/20 bg-success/10">
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