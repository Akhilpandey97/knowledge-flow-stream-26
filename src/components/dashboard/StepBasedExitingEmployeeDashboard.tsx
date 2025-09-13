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
  const [hasUploadedInSession, setHasUploadedInSession] = useState(false);
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
        {/* Enhanced Header with Prominent Progress */}
        <div className="bg-gradient-to-r from-background to-muted/20 border-b border-border/50 px-4 md:px-8 py-4 md:py-6 shadow-soft">
          <div className="max-w-6xl mx-auto">
            {/* Main Header Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Knowledge Transfer</h1>
                <p className="text-base md:text-lg text-muted-foreground font-medium">
                  Step {currentStep + 1} of {stepsData.length}: {stepsData[currentStep]?.title}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6">
                <div className="flex items-center gap-3 px-3 md:px-4 py-2 bg-background/80 rounded-lg border border-border/50">
                  <Target className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                  <div className="text-right">
                    <div className="text-xs md:text-sm text-muted-foreground">Target completion</div>
                    <div className="text-sm md:text-base font-semibold text-foreground">Jan 15, 2024</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm md:text-base px-3 md:px-4 py-1 md:py-2 font-semibold border-primary/30 bg-primary/5">
                  {completedSteps}/{stepsData.length} Complete
                </Badge>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-foreground">Overall Progress</h3>
                <div className="text-xl md:text-2xl font-bold text-primary">{progressPercentage}%</div>
              </div>
              <div className="relative">
                <Progress 
                  value={progressPercentage} 
                  variant={progressPercentage >= 80 ? 'success' : progressPercentage >= 50 ? 'warning' : 'critical'}
                  className="h-3 md:h-4 shadow-sm"
                />
                {/* Progress milestones */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Start</span>
                  <span className="hidden sm:inline">25%</span>
                  <span className="hidden sm:inline">50%</span>
                  <span className="hidden sm:inline">75%</span>
                  <span>Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Step Content */}
        <div className="flex-1 overflow-auto bg-muted/10">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
            {/* Step Header */}
            <div className="mb-6 md:mb-8 bg-background rounded-xl p-4 md:p-6 border border-border/50 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getStepIcon(currentStep)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{stepsData[currentStep]?.title}</h2>
                  {stepsData[currentStep]?.isCompleted && (
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-success" />
                      <span className="text-sm font-medium text-success">Completed</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">{stepsData[currentStep]?.description}</p>
            </div>

            {/* Enhanced AI Suggestion */}
            {currentStep === 0 && (
              <div className="mb-6 md:mb-8">
                <Alert className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="p-2 bg-primary/15 rounded-lg mt-1 self-start">
                      <Target className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                    </div>
                    <AlertDescription className="text-primary text-sm md:text-base leading-relaxed flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <span className="font-bold text-primary">💡 AI Suggestion</span>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 self-start">
                          Smart Tip
                        </Badge>
                      </div>
                      <p>Start by documenting your highest-value client relationships first. This will help your successor prioritize their initial outreach.</p>
                    </AlertDescription>
                  </div>
                </Alert>
              </div>
            )}

            {/* Step Content */}
            <div className="bg-background rounded-xl border border-border/50 shadow-soft overflow-hidden">
              <div className="p-4 md:p-8">
                {renderCurrentStep()}
              </div>
            </div>

            {/* Enhanced Navigation */}
            <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-border/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous Step
                </Button>
                
                {/* Step Indicators */}
                <div className="flex items-center gap-2 md:gap-3">
                  {stepsData.map((_, index) => (
                    <div
                      key={index}
                      className={`relative flex items-center justify-center w-8 md:w-10 h-8 md:h-10 rounded-full font-medium text-xs md:text-sm transition-all duration-300 ${
                        index === currentStep
                          ? 'bg-primary text-primary-foreground shadow-md scale-110'
                          : index < currentStep
                          ? 'bg-success text-white shadow-sm'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-4 md:h-5 w-4 md:w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleNextStep}
                  disabled={currentStep === stepsData.length - 1}
                  className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium w-full sm:w-auto"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};