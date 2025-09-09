import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Send,
  X,
  User
} from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  exitingEmployeeName: string;
}

interface Message {
  id: string;
  sender: 'successor' | 'employee';
  content: string;
  timestamp: Date;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  exitingEmployeeName
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'employee',
      content: 'Hi! I\'m here to help with any questions about the handover. Feel free to ask about any specific tasks or processes.',
      timestamp: new Date(Date.now() - 60 * 60 * 1000)
    }
  ]);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'successor',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate employee response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'employee',
        content: 'Thanks for your question! I\'ll get back to you with detailed information shortly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 2000);

    toast({
      title: "Message sent",
      description: `Your question has been sent to ${exitingEmployeeName}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat with {exitingEmployeeName}
          </DialogTitle>
          <DialogDescription>
            Ask questions about tasks, processes, or get clarification on handover items.
          </DialogDescription>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/10 rounded-lg">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'successor' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={msg.sender === 'successor' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
                  {msg.sender === 'successor' ? 'S' : 'E'}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] ${msg.sender === 'successor' ? 'text-right' : ''}`}>
                <div
                  className={`p-3 rounded-lg ${
                    msg.sender === 'successor'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your question here... (Press Enter to send, Shift+Enter for new line)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-h-[60px] max-h-[120px]"
            />
            <div className="flex flex-col gap-2">
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Close Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};