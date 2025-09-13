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
    <div className="w-80 bg-muted/30 border-r flex flex-col">
      <div className="p-6 border-b">
        <h3 className="font-semibold text-lg">Knowledge Transfer Steps</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Complete each section to transfer your knowledge
        </p>
      </div>
      
      <div className="flex-1 p-4 space-y-2">
        {steps.map((step, index) => (
          <Button
            key={step.id}
            variant={currentStep === index ? "default" : "ghost"}
            className={`w-full h-auto p-4 justify-start text-left ${
              currentStep === index ? 'bg-primary text-primary-foreground' : ''
            }`}
            onClick={() => onStepClick(index)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : currentStep === index ? (
                  <div className="h-5 w-5 rounded-full bg-primary-foreground border-2 border-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStepIcon(index)}
                  <span className="font-medium truncate">{step.title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {steps.filter(s => s.isCompleted).length}/{steps.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Steps Completed
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};