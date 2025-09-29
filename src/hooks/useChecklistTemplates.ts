import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

export const useChecklistTemplates = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch checklist templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyTemplateToHandover = async (handoverId: string, templateId: string) => {
    try {
      const { error } = await supabase.rpc('apply_checklist_template', {
        p_handover_id: handoverId,
        p_template_id: templateId
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Checklist template applied successfully'
      });
      
      return true;
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply checklist template',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getTemplatesByRole = (role: string, department?: string) => {
    return templates.filter(template => {
      const roleMatch = template.role === role;
      const departmentMatch = !department || !template.department || template.department === department;
      return roleMatch && departmentMatch;
    });
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    fetchTemplates,
    applyTemplateToHandover,
    getTemplatesByRole
  };
};