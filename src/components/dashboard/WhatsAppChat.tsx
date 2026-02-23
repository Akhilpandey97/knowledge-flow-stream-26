import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Loader2, CheckCheck, MessageCircle, X, Check, Smile
} from 'lucide-react';
import { HelpRequestWithTask } from '@/hooks/useHelpRequests';
import { format } from 'date-fns';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface ChatMessage {
  id: string;
  text: string;
  time: string;
  date: string;
  outgoing: boolean;
  senderLabel?: string;
  taskRef?: string;
  status?: 'pending' | 'replied' | 'resolved';
}

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
  isOpen, onClose, requests, onSendMessage, onRespond,
  title, subtitle, currentUserRole, taskContext, loading = false
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests, isOpen]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    setMessage('');
    try {
      // For employee/manager, respond to the latest pending request if exists
      if (currentUserRole !== 'successor') {
        const pendingReq = requests.find(r => r.status === 'pending');
        if (pendingReq) {
          await onRespond(pendingReq.id, text);
        } else {
          await onSendMessage(text);
        }
      } else {
        await onSendMessage(text);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Flatten requests into a linear message stream
  const chatMessages: ChatMessage[] = [];
  requests.forEach(req => {
    // The original question — always sent by the successor
    chatMessages.push({
      id: req.id + '-q',
      text: req.message,
      time: format(new Date(req.created_at), 'HH:mm'),
      date: format(new Date(req.created_at), 'MMM d, yyyy'),
      outgoing: currentUserRole === 'successor', // successor sent the question
      senderLabel: currentUserRole !== 'successor' ? 'Successor' : undefined,
      taskRef: req.task?.title || undefined,
      status: req.status as any,
    });

    // The response, if any
    if (req.response) {
      chatMessages.push({
        id: req.id + '-r',
        text: req.response,
        time: req.responded_at ? format(new Date(req.responded_at), 'HH:mm') : '',
        date: req.responded_at ? format(new Date(req.responded_at), 'MMM d, yyyy') : format(new Date(req.created_at), 'MMM d, yyyy'),
        outgoing: currentUserRole !== 'successor', // employee/manager sent the reply
        senderLabel: currentUserRole === 'successor' ? 'Employee' : undefined,
      });
    }
  });

  // Group by date
  const groupedByDate: Record<string, ChatMessage[]> = {};
  chatMessages.forEach(msg => {
    if (!groupedByDate[msg.date]) groupedByDate[msg.date] = [];
    groupedByDate[msg.date].push(msg);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl h-[80vh] p-0 flex flex-col overflow-hidden gap-0">
        {/* Header */}
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

        {/* Task context */}
        {taskContext && (
          <div className="bg-primary/5 border-b px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">{taskContext.category}</Badge>
            <span className="text-xs text-muted-foreground truncate">{taskContext.title}</span>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/30" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}>
          {chatMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3 py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageCircle className="h-8 w-8 text-primary/40" />
                </div>
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            </div>
          )}

          {Object.entries(groupedByDate).map(([date, msgs]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center justify-center py-2">
                <span className="text-[10px] font-medium text-muted-foreground bg-card px-3 py-1 rounded-full shadow-sm">
                  {date}
                </span>
              </div>

              {msgs.map(msg => (
                <div key={msg.id} className={`flex ${msg.outgoing ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                    msg.outgoing
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card text-foreground rounded-bl-md'
                  }`}>
                    {/* Sender label for incoming */}
                    {msg.senderLabel && (
                      <div className={`text-[10px] font-bold mb-0.5 ${msg.outgoing ? 'text-primary-foreground/70' : 'text-primary'}`}>
                        {msg.senderLabel}
                      </div>
                    )}
                    {/* Task reference */}
                    {msg.taskRef && (
                      <div className={`text-[10px] font-semibold mb-1 ${msg.outgoing ? 'text-primary-foreground/60' : 'text-primary/70'}`}>
                        re: {msg.taskRef}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.outgoing ? 'justify-end' : ''}`}>
                      <span className={`text-[10px] ${msg.outgoing ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {msg.time}
                      </span>
                      {msg.outgoing && (
                        msg.status === 'resolved'
                          ? <CheckCheck className="h-3 w-3 text-primary-foreground" />
                          : msg.status === 'replied'
                            ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                            : <Check className="h-3 w-3 text-primary-foreground/60" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area — always visible, WhatsApp style */}
        <div className="border-t bg-card p-2 flex items-end gap-2 flex-shrink-0 relative">
          {/* Emoji picker */}
          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-16 left-2 z-50">
              <EmojiPicker 
                onEmojiClick={onEmojiClick} 
                width={320} 
                height={400}
                theme={Theme.AUTO}
                searchPlaceHolder="Search emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 flex-shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile className="h-5 w-5" />
          </Button>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[44px] max-h-[120px]"
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
      </DialogContent>
    </Dialog>
  );
};
