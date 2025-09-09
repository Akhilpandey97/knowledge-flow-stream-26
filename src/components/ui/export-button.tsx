import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileDown, 
  Download, 
  Link, 
  Check, 
  FileText, 
  Share,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface ExportButtonProps {
  title?: string;
  data?: any;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  title = "Export Handover",
  data,
  variant = 'default',
  size = 'default'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const { toast } = useToast();

  const handleExport = async (type: 'pdf' | 'link' | 'email') => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExporting(false);
    setExportComplete(true);
    
    const messages = {
      pdf: 'PDF report generated successfully!',
      link: 'Shareable link created and copied to clipboard!',
      email: 'Export emailed to stakeholders successfully!'
    };
    
    toast({
      title: 'Export Complete',
      description: messages[type],
    });

    // Reset after 3 seconds
    setTimeout(() => setExportComplete(false), 3000);
  };

  if (exportComplete) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2"
      >
        <Button variant="outline" size={size} className="text-success border-success">
          <Check className="w-4 h-4 mr-2" />
          Exported
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        className="relative overflow-hidden"
      >
        {isExporting ? (
          <>
            <motion.div
              className="w-4 h-4 mr-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Download className="w-4 h-4" />
            </motion.div>
            Generating...
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 mr-2" />
            {title}
          </>
        )}
      </Button>
      
      <Button
        variant="outline"
        size={size}
        onClick={() => handleExport('link')}
        disabled={isExporting}
      >
        <Link className="w-4 h-4 mr-2" />
        Share Link
      </Button>
    </div>
  );
};