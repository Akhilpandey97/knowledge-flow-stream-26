import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  Send, 
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { HelpRequestWithTask } from '@/hooks/useHelpRequests';
import { formatDistanceToNow } from 'date-fns';

interface HelpRequestsPanelProps {
  requests: HelpRequestWithTask[];
  loading: boolean;
  onRespond: (requestId: string, response: string) => Promise<boolean>;
  onResolve?: (requestId: string) => Promise<boolean>;
  title: string;
  description: string;
  emptyMessage: string;
  showResolveButton?: boolean;
  viewerRole: 'employee' | 'manager' | 'successor';
}

export const HelpRequestsPanel: React.FC<HelpRequestsPanelProps> = ({
  requests,
  loading,
  onRespond,
  onResolve,
  title,
  description,
  emptyMessage,
  showResolveButton = false,
  viewerRole
}) => {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleRespond = async (requestId: string) => {
    const text = responseText[requestId];
    if (!text?.trim()) return;

    setSubmitting(requestId);
    const success = await onRespond(requestId, text);
    if (success) {
      setResponseText(prev => ({ ...prev, [requestId]: '' }));
      setExpandedRequest(null);
    }
    setSubmitting(null);
  };

  const handleResolve = async (requestId: string) => {
    if (!onResolve) return;
    setSubmitting(requestId);
    await onResolve(requestId);
    setSubmitting(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'replied':
        return <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20"><MessageSquare className="h-3 w-3 mr-1" /> Replied</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-medium">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          {title}
          {requests.length > 0 && (
            <Badge variant="secondary" className="ml-2">{requests.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className={`border rounded-lg overflow-hidden transition-all ${
                  request.status === 'pending' ? 'border-warning/30 bg-warning/5' : 
                  request.status === 'replied' ? 'border-primary/30 bg-primary/5' : 
                  'border-success/30 bg-success/5'
                }`}
              >
                {/* Request Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {request.request_type === 'employee' ? (
                          <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <HelpCircle className="h-4 w-4 text-warning flex-shrink-0" />
                        )}
                        <span className="font-medium text-sm truncate">
                          {request.task?.title || 'Unknown Task'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(request.status)}
                      {expandedRequest === request.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedRequest === request.id && (
                  <div className="border-t px-4 py-4 space-y-4 bg-background">
                    {/* Full Message */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Question</p>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                      </div>
                    </div>

                    {/* Task Context */}
                    {request.task && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Related Task</p>
                        <div className="bg-muted/30 rounded-lg p-3 border">
                          <p className="font-medium text-sm">{request.task.title}</p>
                          {request.task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{request.task.description}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Existing Response */}
                    {request.response && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Response</p>
                        <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                          <p className="text-sm whitespace-pre-wrap">{request.response}</p>
                          {request.responded_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Replied {formatDistanceToNow(new Date(request.responded_at), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Response Input (for employee/manager) */}
                    {viewerRole !== 'successor' && request.status === 'pending' && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Response</p>
                        <Textarea
                          placeholder="Type your response here..."
                          value={responseText[request.id] || ''}
                          onChange={(e) => setResponseText(prev => ({ 
                            ...prev, 
                            [request.id]: e.target.value 
                          }))}
                          className="min-h-[100px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => handleRespond(request.id)}
                            disabled={!responseText[request.id]?.trim() || submitting === request.id}
                          >
                            {submitting === request.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Send Response
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Resolve Button (for successor) */}
                    {showResolveButton && viewerRole === 'successor' && request.status === 'replied' && onResolve && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleResolve(request.id)}
                          disabled={submitting === request.id}
                          className="border-success text-success hover:bg-success/10"
                        >
                          {submitting === request.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark as Resolved
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
