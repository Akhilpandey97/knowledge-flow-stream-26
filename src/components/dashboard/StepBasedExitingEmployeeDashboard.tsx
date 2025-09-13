import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Target,
  User,
  Users,
  Workflow,
  ClipboardList
} from 'lucide-react';
import { StepBasedHandover, HandoverStep } from '@/types/handover';
import { DocumentUploadScreen } from './DocumentUploadScreen';
import { StepSidebar } from './StepSidebar';
import { PersonalAccountsStep } from './steps/PersonalAccountsStep';
import { CustomerInsightsStep } from './steps/CustomerInsightsStep';
import { InternalWorkflowsStep } from './steps/InternalWorkflowsStep';
import { PendingTasksStep } from './steps/PendingTasksStep';

export const StepBasedExitingEmployeeDashboard: React.FC = () => {
  const [hasUploadedInSession, setHasUploadedInSession] = useState(true); // Temporarily set to true for development
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize steps data
  const steps: HandoverStep[] = [
    {
      id: '1',
      title: 'Personal Accounts & Pipeline',
      description: 'Document your client relationships and ongoing deals',
      isCompleted: false,
      order: 0
    },
    {
      id: '2',
      title: 'Customer Insights',
      description: 'Share customer preferences and market knowledge',
      isCompleted: false,
      order: 1
    },
    {
      id: '3',
      title: 'Internal Workflows',
      description: 'Document processes and team dynamics',
      isCompleted: false,
      order: 2
    },
    {
      id: '4',
      title: 'Pending Tasks',
      description: 'List urgent tasks and project status',
      isCompleted: false,
      order: 3
    }
  ];

  const [stepsData, setStepsData] = useState(steps);

  const completedSteps = stepsData.filter(step => step.isCompleted).length;
  const progressPercentage = Math.round((completedSteps / stepsData.length) * 100);

  const handleStepComplete = (stepIndex: number) => {
    setStepsData(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, isCompleted: true } : step
    ));
  };

  const handleNextStep = () => {
    if (currentStep < stepsData.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <PersonalAccountsStep onComplete={() => handleStepComplete(0)} />;
      case 1:
        return <CustomerInsightsStep onComplete={() => handleStepComplete(1)} />;
      case 2:
        return <InternalWorkflowsStep onComplete={() => handleStepComplete(2)} />;
      case 3:
        return <PendingTasksStep onComplete={() => handleStepComplete(3)} />;
      default:
        return <PersonalAccountsStep onComplete={() => handleStepComplete(0)} />;
    }
  };

  const getStepIcon = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return <User className="h-5 w-5" />;
      case 1:
        return <Users className="h-5 w-5" />;
      case 2:
        return <Workflow className="h-5 w-5" />;
      case 3:
        return <ClipboardList className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  // Always show document upload screen first for exiting employees
  if (!hasUploadedInSession) {
    return (
      <DocumentUploadScreen 
        onUploadComplete={() => setHasUploadedInSession(true)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <StepSidebar 
        steps={stepsData}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        getStepIcon={getStepIcon}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Knowledge Transfer</h1>
              <p className="text-muted-foreground">
                Step {currentStep + 1} of {stepsData.length}: {stepsData[currentStep]?.title}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Target completion: <span className="font-medium">Jan 15, 2024</span>
                </span>
              </div>
              <Badge variant="outline" className="text-sm">
                {completedSteps}/{stepsData.length} Complete
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{progressPercentage}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              variant={progressPercentage >= 80 ? 'success' : progressPercentage >= 50 ? 'warning' : 'critical'}
              className="h-2"
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Step Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {getStepIcon(currentStep)}
                <h2 className="text-xl font-semibold">{stepsData[currentStep]?.title}</h2>
                {stepsData[currentStep]?.isCompleted && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
              </div>
              <p className="text-muted-foreground">{stepsData[currentStep]?.description}</p>
            </div>

            {/* AI Suggestion */}
            {currentStep === 0 && (
              <Alert className="mb-6 border-primary/20 bg-primary-soft">
                <Target className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary">
                  <strong>AI Suggestion:</strong> Start by documenting your highest-value client relationships first. 
                  This will help your successor prioritize their initial outreach.
                </AlertDescription>
              </Alert>
            )}

            {/* Step Content */}
            {renderCurrentStep()}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Step
              </Button>
              
              <div className="flex items-center gap-2">
                {stepsData.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-success'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNextStep}
                disabled={currentStep === stepsData.length - 1}
                className="flex items-center gap-2"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};