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
    <div className="space-y-8">
      {/* Client Accounts Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <span>Client Accounts & Relationships</span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Document your key client relationships, account values, and important contact information.
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {data.clientAccounts.map((account, index) => (
            <Card key={index} className="border-2 border-muted/50 bg-muted/20 hover:bg-muted/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-semibold text-lg text-foreground">Client Account #{index + 1}</h4>
                  {data.clientAccounts.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeClientAccount(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor={`client-name-${index}`} className="text-sm font-semibold text-foreground">
                      Client Name *
                    </Label>
                    <Input
                      id={`client-name-${index}`}
                      value={account.clientName}
                      onChange={(e) => updateClientAccount(index, 'clientName', e.target.value)}
                      placeholder="Enter client company name"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`account-value-${index}`} className="text-sm font-semibold text-foreground">
                      Account Value
                    </Label>
                    <Input
                      id={`account-value-${index}`}
                      value={account.accountValue}
                      onChange={(e) => updateClientAccount(index, 'accountValue', e.target.value)}
                      placeholder="e.g., $50,000 annually"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`relationship-${index}`} className="text-sm font-semibold text-foreground">
                      Relationship Status
                    </Label>
                    <Input
                      id={`relationship-${index}`}
                      value={account.relationship}
                      onChange={(e) => updateClientAccount(index, 'relationship', e.target.value)}
                      placeholder="e.g., Excellent, Good, Needs attention"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`key-contacts-${index}`} className="text-sm font-semibold text-foreground">
                      Key Contacts
                    </Label>
                    <Input
                      id={`key-contacts-${index}`}
                      value={account.keyContacts}
                      onChange={(e) => updateClientAccount(index, 'keyContacts', e.target.value)}
                      placeholder="Primary contacts and their roles"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Label htmlFor={`client-notes-${index}`} className="text-sm font-semibold text-foreground">
                    Important Notes & Context
                  </Label>
                  <Textarea
                    id={`client-notes-${index}`}
                    value={account.notes}
                    onChange={(e) => updateClientAccount(index, 'notes', e.target.value)}
                    placeholder="Any specific preferences, issues, communication style, or important context your successor should know..."
                    rows={4}
                    className="text-base leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            variant="outline" 
            onClick={addClientAccount} 
            className="w-full h-12 text-base font-medium border-dashed border-2 hover:bg-muted/50"
          >
            <Plus className="h-5 w-5 mr-3" />
            Add Another Client Account
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline Deals Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <span>Pipeline & Ongoing Deals</span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Document active deals, their current status, and next steps for seamless handover.
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {data.pipelineDeals.map((deal, index) => (
            <Card key={index} className="border-2 border-muted/50 bg-muted/20 hover:bg-muted/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-semibold text-lg text-foreground">Deal #{index + 1}</h4>
                  {data.pipelineDeals.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePipelineDeal(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor={`deal-name-${index}`} className="text-sm font-semibold text-foreground">
                      Deal Name *
                    </Label>
                    <Input
                      id={`deal-name-${index}`}
                      value={deal.dealName}
                      onChange={(e) => updatePipelineDeal(index, 'dealName', e.target.value)}
                      placeholder="Project or deal name"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`deal-value-${index}`} className="text-sm font-semibold text-foreground">
                      Deal Value
                    </Label>
                    <Input
                      id={`deal-value-${index}`}
                      value={deal.value}
                      onChange={(e) => updatePipelineDeal(index, 'value', e.target.value)}
                      placeholder="e.g., $25,000"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`deal-stage-${index}`} className="text-sm font-semibold text-foreground">
                      Current Stage
                    </Label>
                    <Input
                      id={`deal-stage-${index}`}
                      value={deal.stage}
                      onChange={(e) => updatePipelineDeal(index, 'stage', e.target.value)}
                      placeholder="e.g., Proposal, Negotiation, Closing"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`deal-timeline-${index}`} className="text-sm font-semibold text-foreground">
                      Expected Timeline
                    </Label>
                    <Input
                      id={`deal-timeline-${index}`}
                      value={deal.timeline}
                      onChange={(e) => updatePipelineDeal(index, 'timeline', e.target.value)}
                      placeholder="Expected close date"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Label htmlFor={`deal-notes-${index}`} className="text-sm font-semibold text-foreground">
                    Deal Notes & Next Steps
                  </Label>
                  <Textarea
                    id={`deal-notes-${index}`}
                    value={deal.notes}
                    onChange={(e) => updatePipelineDeal(index, 'notes', e.target.value)}
                    placeholder="Current status, next steps, potential issues, decision makers involved..."
                    rows={4}
                    className="text-base leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            variant="outline" 
            onClick={addPipelineDeal} 
            className="w-full h-12 text-base font-medium border-dashed border-2 hover:bg-muted/50"
          >
            <Plus className="h-5 w-5 mr-3" />
            Add Another Deal
          </Button>
        </CardContent>
      </Card>

      {/* Additional Notes Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="text-xl">Additional Notes & Insights</CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Share any general insights, patterns, or recommendations for managing these accounts.
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-3">
            <Label htmlFor="additional-notes" className="text-sm font-semibold text-foreground">
              General Account Management Insights
            </Label>
            <Textarea
              id="additional-notes"
              value={data.additionalNotes}
              onChange={(e) => setData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Include any general insights, patterns, seasonal trends, or recommendations for managing these accounts effectively..."
              rows={5}
              className="text-base leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Save Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          className="px-8 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          Save & Continue to Next Step
        </Button>
      </div>
    </div>
  );
};