import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Users, TrendingUp } from 'lucide-react';
import { CustomerInsightsData } from '@/types/handover';

interface CustomerInsightsStepProps {
  onComplete: () => void;
}

export const CustomerInsightsStep: React.FC<CustomerInsightsStepProps> = ({ onComplete }) => {
  const [data, setData] = useState<CustomerInsightsData>({
    customerProfiles: [
      {
        customerName: '',
        industry: '',
        preferences: '',
        history: '',
        specialNotes: ''
      }
    ],
    marketInsights: '',
    competitorInfo: '',
    recommendations: ''
  });

  const addCustomerProfile = () => {
    setData(prev => ({
      ...prev,
      customerProfiles: [
        ...prev.customerProfiles,
        {
          customerName: '',
          industry: '',
          preferences: '',
          history: '',
          specialNotes: ''
        }
      ]
    }));
  };

  const removeCustomerProfile = (index: number) => {
    setData(prev => ({
      ...prev,
      customerProfiles: prev.customerProfiles.filter((_, i) => i !== index)
    }));
  };

  const updateCustomerProfile = (index: number, field: keyof CustomerInsightsData['customerProfiles'][0], value: string) => {
    setData(prev => ({
      ...prev,
      customerProfiles: prev.customerProfiles.map((profile, i) => 
        i === index ? { ...profile, [field]: value } : profile
      )
    }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Customer Profiles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Profiles & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.customerProfiles.map((profile, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Customer Profile #{index + 1}</h4>
                  {data.customerProfiles.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomerProfile(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`customer-name-${index}`}>Customer Name</Label>
                    <Input
                      id={`customer-name-${index}`}
                      value={profile.customerName}
                      onChange={(e) => updateCustomerProfile(index, 'customerName', e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`industry-${index}`}>Industry</Label>
                    <Input
                      id={`industry-${index}`}
                      value={profile.industry}
                      onChange={(e) => updateCustomerProfile(index, 'industry', e.target.value)}
                      placeholder="Customer's industry"
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`preferences-${index}`}>Communication Preferences & Style</Label>
                    <Textarea
                      id={`preferences-${index}`}
                      value={profile.preferences}
                      onChange={(e) => updateCustomerProfile(index, 'preferences', e.target.value)}
                      placeholder="How do they prefer to communicate? What style works best?"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`history-${index}`}>Relationship History</Label>
                    <Textarea
                      id={`history-${index}`}
                      value={profile.history}
                      onChange={(e) => updateCustomerProfile(index, 'history', e.target.value)}
                      placeholder="Key milestones, past projects, relationship evolution"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`special-notes-${index}`}>Special Notes & Considerations</Label>
                    <Textarea
                      id={`special-notes-${index}`}
                      value={profile.specialNotes}
                      onChange={(e) => updateCustomerProfile(index, 'specialNotes', e.target.value)}
                      placeholder="Important things to remember, sensitivities, or special requirements"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={addCustomerProfile} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Another Customer Profile
          </Button>
        </CardContent>
      </Card>

      {/* Market Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Insights & Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="market-insights">Market Trends & Opportunities</Label>
            <Textarea
              id="market-insights"
              value={data.marketInsights}
              onChange={(e) => setData(prev => ({ ...prev, marketInsights: e.target.value }))}
              placeholder="Share your insights about market trends, emerging opportunities, or changes you've observed"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Competitor Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Competitor Landscape</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="competitor-info">Key Competitors & Positioning</Label>
            <Textarea
              id="competitor-info"
              value={data.competitorInfo}
              onChange={(e) => setData(prev => ({ ...prev, competitorInfo: e.target.value }))}
              placeholder="Who are the main competitors? What are their strengths/weaknesses? How do we position against them?"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="recommendations">Recommendations for Customer Success</Label>
            <Textarea
              id="recommendations"
              value={data.recommendations}
              onChange={(e) => setData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="What strategies have worked well? What should your successor focus on? Any lessons learned?"
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