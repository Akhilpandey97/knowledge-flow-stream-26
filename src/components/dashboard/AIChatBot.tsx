import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, Send, Loader2, X, Sparkles, User
} from 'lucide-react';
import { HandoverTask } from '@/types/handover';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: HandoverTask[];
  userRole: 'successor' | 'employee' | 'manager';
  contextInfo?: {
    handoverProgress?: number;
    exitingEmployeeName?: string;
    department?: string;
  };
}

export const AIChatBot: React.FC<AIChatBotProps> = ({
  isOpen, onClose, tasks, userRole, contextInfo
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build context from tasks
  const buildContext = () => {
    const taskSummary = tasks.map(t => 
      `- ${t.title} [${t.status}/${t.priority}]${t.notes ? `: ${t.notes.substring(0, 200)}` : ''}${t.insights?.length ? ` (${t.insights.length} insights)` : ''}`
    ).join('\n');

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const progress = tasks.length > 0 ? Math.round(completedCount / tasks.length * 100) : 0;

    return `You are an AI assistant for a knowledge handover platform. The user is a ${userRole}.
${contextInfo?.exitingEmployeeName ? `Exiting employee: ${contextInfo.exitingEmployeeName}` : ''}
${contextInfo?.department ? `Department: ${contextInfo.department}` : ''}
Handover Progress: ${contextInfo?.handoverProgress ?? progress}%
Tasks (${completedCount}/${tasks.length} completed):
${taskSummary || 'No tasks yet.'}

Help the user with handover-related questions. Be concise, specific, and actionable. Reference specific tasks when relevant.`;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-handover-chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input }
          ],
          context: buildContext()
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to get AI response');
      }

      // Stream response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m)
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      // Fallback: generate a helpful local response
      const fallbackResponses = [
        `Based on the ${tasks.length} tasks in this handover, here's what I recommend focusing on:`,
        tasks.filter(t => t.status !== 'completed' && t.priority === 'critical').length > 0
          ? `\n\n**Critical items needing attention:**\n${tasks.filter(t => t.status !== 'completed' && t.priority === 'critical').map(t => `• ${t.title}`).join('\n')}`
          : '',
        tasks.filter(t => t.status !== 'completed' && t.priority === 'high').length > 0
          ? `\n\n**High priority items:**\n${tasks.filter(t => t.status !== 'completed' && t.priority === 'high').map(t => `• ${t.title}`).join('\n')}`
          : '',
        `\n\nOverall progress: ${tasks.length > 0 ? Math.round(tasks.filter(t => t.status === 'completed').length / tasks.length * 100) : 0}%`,
        `\n\n*Note: AI assistant is running in offline mode. Connect Lovable AI for enhanced responses.*`
      ].join('');

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fallbackResponses,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQueries = userRole === 'successor' 
    ? ['What should I focus on first?', 'Summarize critical gaps', 'What tasks are overdue?']
    : userRole === 'employee'
    ? ['What tasks need my attention?', 'Summarize my progress', 'Any unanswered questions?']
    : ['Which handovers are at risk?', 'Department health summary', 'Pending escalations'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg h-[70vh] p-0 flex flex-col overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-primary-foreground">Handover AI Assistant</h3>
            <p className="text-xs text-primary-foreground/70 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
              {tasks.length} tasks in context
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[hsl(var(--muted)/0.3)]">
          {messages.length === 0 && (
            <div className="text-center space-y-4 py-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">How can I help?</p>
                <p className="text-xs text-muted-foreground mt-1">I have full context of this handover</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQueries.map(q => (
                  <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-muted/50 text-foreground transition-colors enterprise-shadow">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary/10' : 'bg-primary/10'
                }`}>
                  {msg.role === 'user' 
                    ? <User className="h-3 w-3 text-primary" />
                    : <Bot className="h-3 w-3 text-primary" />}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 enterprise-shadow ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card text-foreground rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.content === '' && isLoading && (
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  <span className={`text-[10px] mt-1 block ${
                    msg.role === 'user' ? 'text-primary-foreground/50 text-right' : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-card p-3 flex items-end gap-2 flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about this handover..."
            className="min-h-[44px] max-h-[120px] text-sm flex-1 resize-none"
            rows={1}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="sm" className="h-10 w-10 p-0 rounded-full flex-shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Floating AI button component
export const AIFloatingButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground enterprise-shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50 group"
  >
    <Bot className="h-6 w-6" />
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-background" />
  </button>
);
