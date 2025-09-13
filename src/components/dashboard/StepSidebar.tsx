import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';
import { HandoverStep } from '@/types/handover';

interface StepSidebarProps {
  steps: HandoverStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  getStepIcon: (stepIndex: number) => React.ReactNode;
}

export const StepSidebar: React.FC<StepSidebarProps> = ({
  steps,
  currentStep,
  onStepClick,
  getStepIcon
}) => {
  return (
    <div className="w-80 bg-gradient-to-b from-muted/20 to-muted/40 border-r border-border/50 flex flex-col shadow-medium">
      {/* Enhanced Header */}
      <div className="p-8 border-b border-border/50 bg-background/60 backdrop-blur-sm">
        <h3 className="font-bold text-xl text-foreground mb-2">Knowledge Transfer Steps</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Complete each section to transfer your knowledge effectively
        </p>
      </div>
      
      {/* Enhanced Steps List */}
      <div className="flex-1 p-6 space-y-3">
        {steps.map((step, index) => (
          <Button
            key={step.id}
            variant={currentStep === index ? "default" : "ghost"}
            className={`w-full h-auto p-5 justify-start text-left transition-all duration-300 relative group ${
              currentStep === index 
                ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02] border-l-4 border-l-primary-foreground' 
                : step.isCompleted
                ? 'bg-success/10 hover:bg-success/20 border-l-4 border-l-success'
                : 'hover:bg-muted/60 border-l-4 border-l-transparent'
            }`}
            onClick={() => onStepClick(index)}
          >
            <div className="flex items-start gap-4 w-full">
              {/* Enhanced Step Indicator */}
              <div className="flex-shrink-0 mt-1">
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  step.isCompleted 
                    ? 'bg-success text-white' 
                    : currentStep === index 
                    ? 'bg-primary-foreground text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : currentStep === index ? (
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
              </div>
              
              {/* Enhanced Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-1.5 rounded-md transition-colors ${
                    currentStep === index 
                      ? 'bg-primary-foreground/20' 
                      : step.isCompleted 
                      ? 'bg-success/20' 
                      : 'bg-muted/50'
                  }`}>
                    {getStepIcon(index)}
                  </div>
                  <span className="font-semibold text-sm truncate leading-tight">{step.title}</span>
                </div>
                <p className={`text-xs leading-relaxed ${
                  currentStep === index 
                    ? 'text-primary-foreground/80' 
                    : 'text-muted-foreground'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      {/* Enhanced Progress Summary */}
      <div className="p-6 border-t border-border/50 bg-background/60 backdrop-blur-sm">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-soft">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary mb-2">
                {steps.filter(s => s.isCompleted).length}/{steps.length}
              </div>
              <div className="text-sm font-medium text-foreground">
                Steps Completed
              </div>
              <div className="text-xs text-muted-foreground">
                {steps.length - steps.filter(s => s.isCompleted).length} remaining
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};