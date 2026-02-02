import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({ 
  text, 
  maxLines = 5,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Rough estimate: if text has more than maxLines * 80 characters or multiple newlines
  const lines = text.split('\n');
  const isLongText = lines.length > maxLines || text.length > maxLines * 100;
  
  if (!isLongText) {
    return (
      <p className={`text-foreground leading-relaxed whitespace-pre-wrap ${className}`}>
        {text}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`relative ${!isExpanded ? 'max-h-32 overflow-hidden' : ''}`}>
        <p className={`text-foreground leading-relaxed whitespace-pre-wrap ${className}`}>
          {text}
        </p>
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-primary hover:text-primary hover:bg-primary/10"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-4 h-4 mr-1" />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4 mr-1" />
            Show More
          </>
        )}
      </Button>
    </div>
  );
};
