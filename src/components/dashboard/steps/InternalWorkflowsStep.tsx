import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Workflow, Settings } from 'lucide-react';
import { InternalWorkflowsData } from '@/types/handover';

interface InternalWorkflowsStepProps {
  onComplete: () => void;
}

export const InternalWorkflowsStep: React.FC<InternalWorkflowsStepProps> = ({ onComplete }) => {
  const [data, setData] = useState<InternalWorkflowsData>({
    processes: [
      {
        processName: '',
        description: '',
        frequency: '',
        stakeholders: '',
        notes: ''
      }
    ],
    systemAccess: [
      {
        systemName: '',
        accessLevel: '',
        credentials: '',
        notes: ''
      }
    ],
    teamDynamics: '',
    operationalNotes: ''
  });

  const addProcess = () => {
    setData(prev => ({
      ...prev,
      processes: [
        ...prev.processes,
        {
          processName: '',
          description: '',
          frequency: '',
          stakeholders: '',
          notes: ''
        }
      ]
    }));
  };

  const removeProcess = (index: number) => {
    setData(prev => ({
      ...prev,
      processes: prev.processes.filter((_, i) => i !== index)
    }));
  };

  const updateProcess = (index: number, field: keyof InternalWorkflowsData['processes'][0], value: string) => {
    setData(prev => ({
      ...prev,
      processes: prev.processes.map((process, i) => 
        i === index ? { ...process, [field]: value } : process
      )
    }));
  };

  const addSystemAccess = () => {
    setData(prev => ({
      ...prev,
      systemAccess: [
        ...prev.systemAccess,
        {
          systemName: '',
          accessLevel: '',
          credentials: '',
          notes: ''
        }
      ]
    }));
  };

  const removeSystemAccess = (index: number) => {
    setData(prev => ({
      ...prev,
      systemAccess: prev.systemAccess.filter((_, i) => i !== index)
    }));
  };

  const updateSystemAccess = (index: number, field: keyof InternalWorkflowsData['systemAccess'][0], value: string) => {
    setData(prev => ({
      ...prev,
      systemAccess: prev.systemAccess.map((system, i) => 
        i === index ? { ...system, [field]: value } : system
      )
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Internal Processes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Internal Processes & Workflows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.processes.map((process, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Process #{index + 1}</h4>
                  {data.processes.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProcess(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`process-name-${index}`}>Process Name</Label>
                    <Input
                      id={`process-name-${index}`}
                      value={process.processName}
                      onChange={(e) => updateProcess(index, 'processName', e.target.value)}
                      placeholder="Name of the process or workflow"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                    <Input
                      id={`frequency-${index}`}
                      value={process.frequency}
                      onChange={(e) => updateProcess(index, 'frequency', e.target.value)}
                      placeholder="e.g., Daily, Weekly, Monthly"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>Process Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={process.description}
                      onChange={(e) => updateProcess(index, 'description', e.target.value)}
                      placeholder="Detailed description of the process and steps involved"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`stakeholders-${index}`}>Key Stakeholders</Label>
                    <Textarea
                      id={`stakeholders-${index}`}
                      value={process.stakeholders}
                      onChange={(e) => updateProcess(index, 'stakeholders', e.target.value)}
                      placeholder="Who is involved? Who needs to be informed?"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`process-notes-${index}`}>Important Notes</Label>
                    <Textarea
                      id={`process-notes-${index}`}
                      value={process.notes}
                      onChange={(e) => updateProcess(index, 'notes', e.target.value)}
                      placeholder="Tips, common issues, or things to watch out for"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addProcess} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Process
          </Button>
        </CardContent>
      </Card>

      {/* System Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Access & Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.systemAccess.map((system, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">System #{index + 1}</h4>
                  {data.systemAccess.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSystemAccess(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`system-name-${index}`}>System/Tool Name</Label>
                    <Input
                      id={`system-name-${index}`}
                      value={system.systemName}
                      onChange={(e) => updateSystemAccess(index, 'systemName', e.target.value)}
                      placeholder="e.g., CRM, Project Management Tool"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`access-level-${index}`}>Access Level</Label>
                    <Input
                      id={`access-level-${index}`}
                      value={system.accessLevel}
                      onChange={(e) => updateSystemAccess(index, 'accessLevel', e.target.value)}
                      placeholder="e.g., Admin, User, Read-only"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`credentials-${index}`}>Login/Access Information</Label>
                    <Textarea
                      id={`credentials-${index}`}
                      value={system.credentials}
                      onChange={(e) => updateSystemAccess(index, 'credentials', e.target.value)}
                      placeholder="Account details, how to request access (DO NOT include passwords)"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`system-notes-${index}`}>Usage Notes</Label>
                    <Textarea
                      id={`system-notes-${index}`}
                      value={system.notes}
                      onChange={(e) => updateSystemAccess(index, 'notes', e.target.value)}
                      placeholder="How the system is used, important features, tips"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addSystemAccess} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another System
          </Button>
        </CardContent>
      </Card>

      {/* Team Dynamics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Team Dynamics & Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="team-dynamics">Team Structure & Relationships</Label>
            <Textarea
              id="team-dynamics"
              value={data.teamDynamics}
              onChange={(e) => setData(prev => ({ ...prev, teamDynamics: e.target.value }))}
              placeholder="Describe team dynamics, key relationships, communication patterns, and who to work with for what"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operational Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Operational Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="operational-notes">General Operations & Best Practices</Label>
            <Textarea
              id="operational-notes"
              value={data.operationalNotes}
              onChange={(e) => setData(prev => ({ ...prev, operationalNotes: e.target.value }))}
              placeholder="Any other operational knowledge, best practices, or institutional knowledge that would be helpful"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="px-8">
          Save & Continue
        </Button>
      </div>
    </div>
  );
};