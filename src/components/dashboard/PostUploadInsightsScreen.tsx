import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Target,
  Loader2,
  FileText,
  Sparkles
} from 'lucide-react';
import { useAIInsights, AIInsight } from '@/hooks/useAIInsights';

interface PostUploadInsightsScreenProps {
  handoverId: string;
  onBackToDashboard: () => void;
}

export const PostUploadInsightsScreen: React.FC<PostUploadInsightsScreenProps> = ({
  handoverId,
  onBackToDashboard
}) => {
  const { insights, loading, error, refetch } = useAIInsights(handoverId);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'critical':
        return <Target className="h-5 w-5 text-critical" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getInsightBadgeVariant = (type: AIInsight['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'success':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const getInsightTypeLabel = (type: AIInsight['type']) => {
    switch (type) {
      case 'critical':
        return 'Critical';
      case 'warning':
        return 'Important';
      case 'success':
        return 'Success';
      default:
        return 'Info';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Document Insights Generated
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Your document has been analyzed and key insights have been extracted. 
            Review these findings below to enhance your knowledge transfer process.
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="border-border/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  AI-Generated Insights
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Key findings from your uploaded document
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-lg text-muted-foreground">Processing your document insights...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error loading insights: {error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refetch}
                    className="ml-3"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : insights.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Insights Processing
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your document is still being analyzed. Insights will appear here once the AI processing is complete.
                    This usually takes a few minutes.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={refetch}
                  className="mt-4"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Check for Updates
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <Card key={insight.id} className="border-border/30 bg-background/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getInsightIcon(insight.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground text-sm">
                                {insight.title}
                              </h4>
                              <Badge variant={getInsightBadgeVariant(insight.type)} className="text-xs">
                                {getInsightTypeLabel(insight.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {insight.description}
                            </p>
                            {insight.icon && (
                              <div className="text-xs text-muted-foreground/70 mt-2">
                                {insight.icon}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Summary Stats */}
            {insights.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{insights.length}</div>
                    <div className="text-xs text-muted-foreground">Total Insights</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-critical">
                      {insights.filter(i => i.type === 'critical').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning">
                      {insights.filter(i => i.type === 'warning').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Important</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {insights.filter(i => i.type === 'success').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button 
            onClick={onBackToDashboard}
            className="px-6 py-2 h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Information Alert */}
        <Alert className="bg-primary-soft border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary-foreground/80">
            These insights are automatically generated from your uploaded document to help identify 
            key knowledge areas for your handover process. You can return to this screen anytime 
            from your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};