import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, User, TrendingUp } from 'lucide-react';
import { PersonalAccountsData } from '@/types/handover';

interface PersonalAccountsStepProps {
  onComplete: () => void;
}

export const PersonalAccountsStep: React.FC<PersonalAccountsStepProps> = ({ onComplete }) => {
  const [data, setData] = useState<PersonalAccountsData>({
    clientAccounts: [
      {
        clientName: '',
        accountValue: '',
        relationship: '',
        keyContacts: '',
        notes: ''
      }
    ],
    pipelineDeals: [
      {
        dealName: '',
        value: '',
        stage: '',
        timeline: '',
        notes: ''
      }
    ],
    additionalNotes: ''
  });

  const addClientAccount = () => {
    setData(prev => ({
      ...prev,
      clientAccounts: [
        ...prev.clientAccounts,
        {
          clientName: '',
          accountValue: '',
          relationship: '',
          keyContacts: '',
          notes: ''
        }
      ]
    }));
  };

  const removeClientAccount = (index: number) => {
    setData(prev => ({
      ...prev,
      clientAccounts: prev.clientAccounts.filter((_, i) => i !== index)
    }));
  };

  const updateClientAccount = (index: number, field: keyof PersonalAccountsData['clientAccounts'][0], value: string) => {
    setData(prev => ({
      ...prev,
      clientAccounts: prev.clientAccounts.map((account, i) => 
        i === index ? { ...account, [field]: value } : account
      )
    }));
  };

  const addPipelineDeal = () => {
    setData(prev => ({
      ...prev,
      pipelineDeals: [
        ...prev.pipelineDeals,
        {
          dealName: '',
          value: '',
          stage: '',
          timeline: '',
          notes: ''
        }
      ]
    }));
  };

  const removePipelineDeal = (index: number) => {
    setData(prev => ({
      ...prev,
      pipelineDeals: prev.pipelineDeals.filter((_, i) => i !== index)
    }));
  };

  const updatePipelineDeal = (index: number, field: keyof PersonalAccountsData['pipelineDeals'][0], value: string) => {
    setData(prev => ({
      ...prev,
      pipelineDeals: prev.pipelineDeals.map((deal, i) => 
        i === index ? { ...deal, [field]: value } : deal
      )
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Client Accounts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Accounts & Relationships
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.clientAccounts.map((account, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Client Account #{index + 1}</h4>
                  {data.clientAccounts.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeClientAccount(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`client-name-${index}`}>Client Name</Label>
                    <Input
                      id={`client-name-${index}`}
                      value={account.clientName}
                      onChange={(e) => updateClientAccount(index, 'clientName', e.target.value)}
                      placeholder="Enter client name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`account-value-${index}`}>Account Value</Label>
                    <Input
                      id={`account-value-${index}`}
                      value={account.accountValue}
                      onChange={(e) => updateClientAccount(index, 'accountValue', e.target.value)}
                      placeholder="$0,000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`relationship-${index}`}>Relationship Status</Label>
                    <Input
                      id={`relationship-${index}`}
                      value={account.relationship}
                      onChange={(e) => updateClientAccount(index, 'relationship', e.target.value)}
                      placeholder="e.g., Excellent, Good, Needs attention"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`key-contacts-${index}`}>Key Contacts</Label>
                    <Input
                      id={`key-contacts-${index}`}
                      value={account.keyContacts}
                      onChange={(e) => updateClientAccount(index, 'keyContacts', e.target.value)}
                      placeholder="Primary contacts and their roles"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`client-notes-${index}`}>Important Notes</Label>
                  <Textarea
                    id={`client-notes-${index}`}
                    value={account.notes}
                    onChange={(e) => updateClientAccount(index, 'notes', e.target.value)}
                    placeholder="Any specific preferences, issues, or important context"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addClientAccount} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Client Account
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline Deals Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pipeline & Ongoing Deals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.pipelineDeals.map((deal, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Deal #{index + 1}</h4>
                  {data.pipelineDeals.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePipelineDeal(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`deal-name-${index}`}>Deal Name</Label>
                    <Input
                      id={`deal-name-${index}`}
                      value={deal.dealName}
                      onChange={(e) => updatePipelineDeal(index, 'dealName', e.target.value)}
                      placeholder="Project or deal name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`deal-value-${index}`}>Deal Value</Label>
                    <Input
                      id={`deal-value-${index}`}
                      value={deal.value}
                      onChange={(e) => updatePipelineDeal(index, 'value', e.target.value)}
                      placeholder="$0,000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`deal-stage-${index}`}>Current Stage</Label>
                    <Input
                      id={`deal-stage-${index}`}
                      value={deal.stage}
                      onChange={(e) => updatePipelineDeal(index, 'stage', e.target.value)}
                      placeholder="e.g., Proposal, Negotiation, Closing"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`deal-timeline-${index}`}>Expected Timeline</Label>
                    <Input
                      id={`deal-timeline-${index}`}
                      value={deal.timeline}
                      onChange={(e) => updatePipelineDeal(index, 'timeline', e.target.value)}
                      placeholder="Expected close date"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`deal-notes-${index}`}>Deal Notes</Label>
                  <Textarea
                    id={`deal-notes-${index}`}
                    value={deal.notes}
                    onChange={(e) => updatePipelineDeal(index, 'notes', e.target.value)}
                    placeholder="Current status, next steps, potential issues"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addPipelineDeal} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Deal
          </Button>
        </CardContent>
      </Card>

      {/* Additional Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="additional-notes">Any other important information about your accounts or pipeline?</Label>
            <Textarea
              id="additional-notes"
              value={data.additionalNotes}
              onChange={(e) => setData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Include any general insights, patterns, or recommendations for managing these accounts"
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