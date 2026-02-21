import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, Loader2, CheckCheck, Clock, MessageCircle, X, Check
} from 'lucide-react';
import { HelpRequestWithTask } from '@/hooks/useHelpRequests';
import { formatDistanceToNow, format } from 'date-fns';

interface WhatsAppChatProps {
  isOpen: boolean;
  onClose: () => void;
  requests: HelpRequestWithTask[];
  onSendMessage: (message: string) => Promise<void>;
  onRespond: (requestId: string, response: string) => Promise<boolean>;
  onResolve?: (requestId: string) => Promise<boolean>;
  title: string;
  subtitle?: string;
  currentUserRole: 'successor' | 'employee' | 'manager';
  taskContext?: { title: string; category: string } | null;
  loading?: boolean;
}

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  isOpen, onClose, requests, onSendMessage, onRespond, onResolve,
  title, subtitle, currentUserRole, taskContext, loading = false
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests, isOpen]);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await onSendMessage(message);
    setMessage('');
    setSending(false);
  };

  const handleReply = async (requestId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    await onRespond(requestId, replyText);
    setReplyText('');
    setRespondingId(null);
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (respondingId) handleReply(respondingId);
      else handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = requests.reduce<Record<string, HelpRequestWithTask[]>>((acc, req) => {
    const date = format(new Date(req.created_at), 'MMM d, yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(req);
    return acc;
  }, {});

  const isOutgoing = (req: HelpRequestWithTask) => {
    if (currentUserRole === 'successor') return true; // successor sends questions
    return false; // employee/manager receive questions
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl h-[75vh] p-0 flex flex-col overflow-hidden gap-0">
        {/* Header — WhatsApp style */}
        <div className="bg-primary px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary-foreground truncate">{title}</h3>
            {subtitle && <p className="text-xs text-primary-foreground/70">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Task context bar */}
        {taskContext && (
          <div className="bg-primary/5 border-b px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">{taskContext.category}</Badge>
            <span className="text-xs text-muted-foreground truncate">{taskContext.title}</span>
          </div>
        )}

        {/* Messages area — chat wallpaper */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[hsl(var(--muted)/0.3)]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}>
          {requests.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            </div>
          )}

          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="space-y-2">
              {/* Date divider */}
              <div className="flex items-center justify-center py-2">
                <span className="text-[10px] font-medium text-muted-foreground bg-card px-3 py-1 rounded-full enterprise-shadow">
                  {date}
                </span>
              </div>

              {msgs.map(req => {
                const outgoing = isOutgoing(req);
                return (
                  <div key={req.id} className="space-y-1">
                    {/* Question bubble */}
                    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 enterprise-shadow relative ${
                        outgoing
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card text-foreground rounded-bl-md'
                      }`}>
                        {/* Task reference */}
                        {req.task?.title && (
                          <div className={`text-[10px] font-semibold mb-1 ${outgoing ? 'text-primary-foreground/70' : 'text-primary'}`}>
                            re: {req.task.title}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{req.message}</p>
                        <div className={`flex items-center gap-1 mt-1 ${outgoing ? 'justify-end' : ''}`}>
                          <span className={`text-[10px] ${outgoing ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                            {format(new Date(req.created_at), 'HH:mm')}
                          </span>
                          {outgoing && (
                            req.response 
                              ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                              : <Check className="h-3 w-3 text-primary-foreground/60" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Response bubble */}
                    {req.response && (
                      <div className={`flex ${outgoing ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 enterprise-shadow ${
                          outgoing
                            ? 'bg-card text-foreground rounded-bl-md'
                            : 'bg-primary text-primary-foreground rounded-br-md'
                        }`}>
                          <p className="text-sm leading-relaxed">{req.response}</p>
                          <div className={`flex items-center gap-1 mt-1 ${outgoing ? '' : 'justify-end'}`}>
                            <span className={`text-[10px] ${outgoing ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>
                              {req.responded_at ? format(new Date(req.responded_at), 'HH:mm') : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pending reply input for responders */}
                    {!outgoing && req.status === 'pending' && currentUserRole !== 'successor' && (
                      <div className="flex justify-end">
                        {respondingId === req.id ? (
                          <div className="max-w-[80%] w-full space-y-2">
                            <div className="flex gap-2">
                              <Textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Type your reply..."
                                className="min-h-[60px] text-xs flex-1"
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setRespondingId(null); setReplyText(''); }}>Cancel</Button>
                              <Button size="sm" className="h-7 text-xs gap-1" disabled={!replyText.trim() || sending} onClick={() => handleReply(req.id)}>
                                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Reply
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-card" onClick={() => setRespondingId(req.id)}>
                            <MessageCircle className="h-3 w-3" /> Reply
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Resolve button for successor */}
                    {outgoing && req.status === 'replied' && onResolve && currentUserRole === 'successor' && (
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-success/30 text-success hover:bg-success/10"
                          onClick={() => onResolve(req.id)}>
                          <CheckCheck className="h-3 w-3" /> Mark Resolved
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {currentUserRole === 'successor' && (
          <div className="border-t bg-card p-3 flex items-end gap-2 flex-shrink-0">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-[120px] text-sm flex-1 resize-none"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              size="sm"
              className="h-10 w-10 p-0 rounded-full flex-shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
