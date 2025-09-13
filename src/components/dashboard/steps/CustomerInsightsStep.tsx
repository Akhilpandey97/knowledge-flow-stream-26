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
    <div className="space-y-8">
      {/* Customer Profiles Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <span>Customer Profiles & Preferences</span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Document customer communication styles, preferences, and behavioral insights for your successor.
          </p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {data.customerProfiles.map((profile, index) => (
            <Card key={index} className="border-2 border-muted/50 bg-muted/20 hover:bg-muted/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-semibold text-lg text-foreground">Customer Profile #{index + 1}</h4>
                  {data.customerProfiles.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomerProfile(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor={`customer-name-${index}`} className="text-sm font-semibold text-foreground">
                      Customer Name *
                    </Label>
                    <Input
                      id={`customer-name-${index}`}
                      value={profile.customerName}
                      onChange={(e) => updateCustomerProfile(index, 'customerName', e.target.value)}
                      placeholder="Enter customer company name"
                      className="h-12 text-base"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`industry-${index}`} className="text-sm font-semibold text-foreground">
                      Industry
                    </Label>
                    <Input
                      id={`industry-${index}`}
                      value={profile.industry}
                      onChange={(e) => updateCustomerProfile(index, 'industry', e.target.value)}
                      placeholder="e.g., Healthcare, Technology, Finance"
                      className="h-12 text-base"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor={`preferences-${index}`} className="text-sm font-semibold text-foreground">
                      Communication Preferences & Style
                    </Label>
                    <Textarea
                      id={`preferences-${index}`}
                      value={profile.preferences}
                      onChange={(e) => updateCustomerProfile(index, 'preferences', e.target.value)}
                      placeholder="How do they prefer to communicate? Email vs calls, formal vs casual tone, frequency preferences..."
                      rows={3}
                      className="text-base leading-relaxed"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`history-${index}`} className="text-sm font-semibold text-foreground">
                      Relationship History & Context
                    </Label>
                    <Textarea
                      id={`history-${index}`}
                      value={profile.history}
                      onChange={(e) => updateCustomerProfile(index, 'history', e.target.value)}
                      placeholder="How long have we worked together? Key milestones, past projects, relationship evolution..."
                      rows={3}
                      className="text-base leading-relaxed"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor={`special-notes-${index}`} className="text-sm font-semibold text-foreground">
                      Special Notes & Insights
                    </Label>
                    <Textarea
                      id={`special-notes-${index}`}
                      value={profile.specialNotes}
                      onChange={(e) => updateCustomerProfile(index, 'specialNotes', e.target.value)}
                      placeholder="Personal interests, decision-making style, pain points, what motivates them..."
                      rows={3}
                      className="text-base leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button 
            variant="outline" 
            onClick={addCustomerProfile} 
            className="w-full h-12 text-base font-medium border-dashed border-2 hover:bg-muted/50"
          >
            <Plus className="h-5 w-5 mr-3" />
            Add Another Customer Profile
          </Button>
        </CardContent>
      </Card>

      {/* Market Insights Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <span>Market Insights & Trends</span>
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Share valuable market insights and trends that will help your successor understand the landscape.
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-3">
            <Label htmlFor="market-insights" className="text-sm font-semibold text-foreground">
              Market Trends & Opportunities
            </Label>
            <Textarea
              id="market-insights"
              value={data.marketInsights}
              onChange={(e) => setData(prev => ({ ...prev, marketInsights: e.target.value }))}
              placeholder="Share your insights about market trends, emerging opportunities, seasonal patterns, or changes you've observed in the industry..."
              rows={5}
              className="text-base leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Competitor Information Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="text-xl">Competitor Landscape</CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Document key competitors and your strategies for positioning against them.
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-3">
            <Label htmlFor="competitor-info" className="text-sm font-semibold text-foreground">
              Key Competitors & Positioning
            </Label>
            <Textarea
              id="competitor-info"
              value={data.competitorInfo}
              onChange={(e) => setData(prev => ({ ...prev, competitorInfo: e.target.value }))}
              placeholder="Who are the main competitors? What are their strengths/weaknesses? How do we position against them? Any competitive intelligence..."
              rows={5}
              className="text-base leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Section */}
      <Card className="border-border/50 shadow-soft overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
          <CardTitle className="text-xl">Strategic Recommendations</CardTitle>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Share your strategic insights and recommendations for customer success.
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-3">
            <Label htmlFor="recommendations" className="text-sm font-semibold text-foreground">
              Recommendations for Customer Success
            </Label>
            <Textarea
              id="recommendations"
              value={data.recommendations}
              onChange={(e) => setData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="What strategies have worked well? What should your successor focus on? Any lessons learned or best practices to share..."
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