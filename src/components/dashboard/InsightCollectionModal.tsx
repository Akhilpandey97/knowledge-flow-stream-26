import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { HandoverTask } from '@/types/handover';
import { supabase } from '@/integrations/supabase/client';

interface FormField {
  id: string;
  field_type: 'text' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio';
  field_label: string;
  field_placeholder: string;
  is_required: boolean;
  field_options: string[];
  validation_rules: Record<string, any>;
  order_index: number;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  is_active: boolean;
}

interface InsightCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: HandoverTask | null;
  onSaveAndNext: (taskId: string, topic: string, insights: string, file?: File) => void;
}

export const InsightCollectionModal: React.FC<InsightCollectionModalProps> = ({
  isOpen,
  onClose,
  task,
  onSaveAndNext
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      fetchFormTemplate();
      resetForm();
    }
  }, [isOpen, task]);

  const fetchFormTemplate = async () => {
    if (!task) return;
    
    setIsLoading(true);
    
    try {
      // First, get the current user's department
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('department')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (userError) {
        console.error('Error fetching user department:', userError);
        setFormTemplate(null);
        setFormFields([]);
        setIsLoading(false);
        return;
      }

      console.log('User department:', userData?.department);

      // Try to get department-specific template with case-insensitive matching
      let { data: template, error: templateError } = await supabase
        .from('insight_form_templates')
        .select('*')
        .eq('is_active', true)
        .ilike('department', userData?.department || '')
        .single();

      console.log('Found template:', template);

      if (!template || templateError) {
        // Fallback to general template (no department specified)
        const { data: generalTemplate, error: generalError } = await supabase
          .from('insight_form_templates')
          .select('*')
          .eq('is_active', true)
          .is('department', null)
          .single();
        
      console.log('Fallback to general template:', generalTemplate);
        template = generalTemplate;
      }

      if (template) {
        setFormTemplate(template);
        
        // Fetch form fields
        const { data: fields } = await supabase
          .from('insight_form_fields')
          .select('*')
          .eq('template_id', template.id)
          .order('order_index');
        
        setFormFields((fields || []).map(field => ({
          ...field,
          field_type: field.field_type as 'text' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio',
          field_options: Array.isArray(field.field_options) ? field.field_options.map(String) : [],
          validation_rules: typeof field.validation_rules === 'object' ? field.validation_rules : {}
        })));
      } else {
        // Use default form if no template found
        console.log('No template found, using default form');
        setFormTemplate(null);
        setFormFields([]);
      }
    } catch (error) {
      console.error('Error fetching form template:', error);
      setFormTemplate(null);
      setFormFields([]);
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormValues({});
    setSelectedFiles({});
    setIsDragOver(false);
  };

  const handleFileSelect = (fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [fieldId]: file }));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (fieldId: string, event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [fieldId]: file }));
    }
  };

  const handleSaveAndNext = () => {
    if (!task) return;
    
    // Validate required fields
    const requiredFields = formFields.filter(field => field.is_required);
    const missingFields = requiredFields.filter(field => {
      const value = formValues[field.id];
      return !value || (Array.isArray(value) && value.length === 0);
    });
    
    if (missingFields.length > 0) {
      return;
    }
    
    // For compatibility with existing interface, extract topic and insights
    const topic = formValues.topic || formValues[formFields[0]?.id] || 'General';
    const insights = formValues.insights || Object.values(formValues).filter(v => typeof v === 'string').join('\n') || '';
    const file = Object.values(selectedFiles)[0];
    
    onSaveAndNext(task.id, topic, insights, file);
    resetForm();
    onClose();
  };

  const removeFile = (fieldId: string) => {
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldId];
      return newFiles;
    });
  };

  const updateFormValue = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: FormField) => {
    const value = formValues[field.id] || '';
    const file = selectedFiles[field.id];

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateFormValue(field.id, e.target.value)}
            placeholder={field.field_placeholder}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFormValue(field.id, e.target.value)}
            placeholder={field.field_placeholder}
            className="min-h-[120px] resize-none"
            required={field.is_required}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => updateFormValue(field.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder={field.field_placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.field_options.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={(val) => updateFormValue(field.id, val)}>
            {field.field_options.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const checkboxValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.field_options.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={checkboxValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...checkboxValues, option]
                      : checkboxValues.filter(v => v !== option);
                    updateFormValue(field.id, newValues);
                  }}
                />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(field.id, e)}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: PDF, DOC, DOCX, TXT, Images
                </p>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileSelect(field.id, e)}
                  className="hidden"
                  id={`file-upload-${field.id}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-upload-${field.id}`)?.click()}
                >
                  Browse Files
                </Button>
              </div>
            ) : (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(field.id)}
                      className="text-green-700 hover:text-green-900"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Default form fallback
  const renderDefaultForm = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="topic" className="text-sm font-medium">
          Select Topic *
        </Label>
        <Select value={formValues.topic || ''} onValueChange={(val) => updateFormValue('topic', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a topic for your insights..." />
          </SelectTrigger>
          <SelectContent>
            {['Client Relationship', 'Account Management', 'Project History', 'Technical Documentation', 'General Information'].map(topic => (
              <SelectItem key={topic} value={topic}>
                {topic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="insights" className="text-sm font-medium">
          Share your insights and knowledge about this task *
        </Label>
        <Textarea
          id="insights"
          placeholder="Share key insights, important contacts, processes, tips, or anything that would help your successor with this task..."
          value={formValues.insights || ''}
          onChange={(e) => updateFormValue('insights', e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>
    </>
  );

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Share Your Insights - {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Task Context */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              <p className="text-xs text-gray-500">Category: {task.category}</p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading form...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formTemplate && formFields.length > 0 ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium text-lg">{formTemplate.name}</h3>
                    {formTemplate.description && (
                      <p className="text-sm text-muted-foreground">{formTemplate.description}</p>
                    )}
                  </div>
                  
                  {formFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {field.field_label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {renderField(field)}
                    </div>
                  ))}
                </>
              ) : (
                renderDefaultForm()
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndNext}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Insight
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};