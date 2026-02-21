import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Edit, Save, X, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DEPARTMENTS } from '@/constants/departments';

interface InsightFormTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

interface FormField {
  id: string;
  template_id: string;
  field_type: 'text' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio';
  field_label: string;
  field_placeholder: string;
  is_required: boolean;
  field_options: string[];
  validation_rules: Record<string, any>;
  order_index: number;
}

const InsightFormBuilder = () => {
  const [templates, setTemplates] = useState<InsightFormTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InsightFormTemplate | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    department: ''
  });
  const [newField, setNewField] = useState({
    field_type: 'text' as const,
    field_label: '',
    field_placeholder: '',
    is_required: false,
    field_options: [''],
    validation_rules: {}
  });
  const { toast } = useToast();

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'file', label: 'File Upload' }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('insight_form_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch form templates',
        variant: 'destructive'
      });
      return;
    }

    setTemplates(data || []);
  };

  const fetchFormFields = async (templateId: string) => {
    const { data, error } = await supabase
      .from('insight_form_fields')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch form fields',
        variant: 'destructive'
      });
      return;
    }

    setFormFields((data || []).map(field => ({
      ...field,
      field_type: field.field_type as 'text' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio',
      field_options: Array.isArray(field.field_options) ? field.field_options.map(String) : [],
      validation_rules: typeof field.validation_rules === 'object' ? field.validation_rules : {}
    })));
  };

  const createTemplate = async () => {
    if (!newTemplate.name) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive'
      });
      return;
    }

    const { data, error } = await supabase
      .from('insight_form_templates')
      .insert({
        name: newTemplate.name,
        description: newTemplate.description,
        department: newTemplate.department || null
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      });
      return;
    }

    setNewTemplate({ name: '', description: '', department: '' });
    fetchTemplates();
    toast({
      title: 'Success',
      description: 'Template created successfully'
    });
  };

  const updateTemplate = async () => {
    if (!selectedTemplate) return;

    const { error } = await supabase
      .from('insight_form_templates')
      .update({
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        department: selectedTemplate.department
      })
      .eq('id', selectedTemplate.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      });
      return;
    }

    setEditingTemplate(false);
    fetchTemplates();
    toast({
      title: 'Success',
      description: 'Template updated successfully'
    });
  };

  const addField = async () => {
    if (!selectedTemplate || !newField.field_label) {
      toast({
        title: 'Error',
        description: 'Field label is required',
        variant: 'destructive'
      });
      return;
    }

    const maxOrder = Math.max(...formFields.map(f => f.order_index), 0);
    
    // Clean up options for non-option fields
    const options = ['select', 'radio', 'checkbox'].includes(newField.field_type) 
      ? newField.field_options.filter(opt => opt.trim()) 
      : [];

    const { error } = await supabase
      .from('insight_form_fields')
      .insert({
        template_id: selectedTemplate.id,
        field_type: newField.field_type,
        field_label: newField.field_label,
        field_placeholder: newField.field_placeholder,
        is_required: newField.is_required,
        field_options: options,
        validation_rules: newField.validation_rules,
        order_index: maxOrder + 1
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add field',
        variant: 'destructive'
      });
      return;
    }

    setNewField({
      field_type: 'text',
      field_label: '',
      field_placeholder: '',
      is_required: false,
      field_options: [''],
      validation_rules: {}
    });
    fetchFormFields(selectedTemplate.id);
    toast({
      title: 'Success',
      description: 'Field added successfully'
    });
  };

  const updateField = async (field: FormField) => {
    const { error } = await supabase
      .from('insight_form_fields')
      .update({
        field_label: field.field_label,
        field_placeholder: field.field_placeholder,
        is_required: field.is_required,
        field_options: field.field_options,
        validation_rules: field.validation_rules
      })
      .eq('id', field.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update field',
        variant: 'destructive'
      });
      return;
    }

    setEditingField(null);
    fetchFormFields(selectedTemplate!.id);
    toast({
      title: 'Success',
      description: 'Field updated successfully'
    });
  };

  const deleteField = async (fieldId: string) => {
    const { error } = await supabase
      .from('insight_form_fields')
      .delete()
      .eq('id', fieldId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete field',
        variant: 'destructive'
      });
      return;
    }

    fetchFormFields(selectedTemplate!.id);
    toast({
      title: 'Success',
      description: 'Field deleted successfully'
    });
  };

  const moveField = async (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = formFields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= formFields.length) return;

    const updates = [
      {
        id: formFields[fieldIndex].id,
        order_index: formFields[newIndex].order_index
      },
      {
        id: formFields[newIndex].id,
        order_index: formFields[fieldIndex].order_index
      }
    ];

    for (const update of updates) {
      await supabase
        .from('insight_form_fields')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    fetchFormFields(selectedTemplate!.id);
  };

  const selectTemplate = (template: InsightFormTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplate(false);
    fetchFormFields(template.id);
  };

  const addOption = () => {
    setNewField(prev => ({
      ...prev,
      field_options: [...prev.field_options, '']
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewField(prev => ({
      ...prev,
      field_options: prev.field_options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const removeOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      field_options: prev.field_options.filter((_, i) => i !== index)
    }));
  };

  const needsOptions = ['select', 'radio', 'checkbox'].includes(newField.field_type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Insight Form Builder</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage dynamic forms for insight collection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <Card className="glass-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Form Templates</CardTitle>
            <CardDescription className="text-xs">Manage insight collection form templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Template Form */}
            <div className="space-y-3 p-4 border border-border/60 rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium text-foreground">Create New Template</h4>
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Client Handover Form"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newTemplate.department}
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Template description"
                  rows={2}
                />
              </div>
              <Button onClick={createTemplate} className="w-full">
                Create Template
              </Button>
            </div>

            {/* Templates List */}
            <div className="space-y-1.5">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-150 ${
                    selectedTemplate?.id === template.id ? 'border-primary bg-primary/5 enterprise-shadow' : 'border-border/40 hover:bg-muted/40 hover:border-border'
                  }`}
                  onClick={() => selectTemplate(template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      {template.department && (
                        <Badge variant="secondary" className="text-xs mt-1">{template.department}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {template.is_active ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        {selectedTemplate && (
          <Card className="glass-panel">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {editingTemplate ? (
                      <Input
                        value={selectedTemplate.name}
                        onChange={(e) => setSelectedTemplate(prev => 
                          prev ? { ...prev, name: e.target.value } : null
                        )}
                        className="font-bold"
                      />
                    ) : (
                      selectedTemplate.name
                    )}
                    {editingTemplate ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={updateTemplate}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setEditingTemplate(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  {editingTemplate ? (
                    <Textarea
                      value={selectedTemplate.description || ''}
                      onChange={(e) => setSelectedTemplate(prev => 
                        prev ? { ...prev, description: e.target.value } : null
                      )}
                      placeholder="Template description"
                      rows={2}
                    />
                  ) : (
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Field */}
              <div className="space-y-3 p-4 border border-border/60 rounded-lg bg-muted/30">
                <h4 className="text-sm font-medium text-foreground">Add New Field</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="fieldType">Field Type</Label>
                    <Select
                      value={newField.field_type}
                      onValueChange={(value: any) => setNewField(prev => ({ ...prev, field_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={newField.is_required}
                      onCheckedChange={(checked) => setNewField(prev => ({ ...prev, is_required: checked }))}
                    />
                    <Label htmlFor="required">Required</Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="fieldLabel">Field Label</Label>
                  <Input
                    id="fieldLabel"
                    value={newField.field_label}
                    onChange={(e) => setNewField(prev => ({ ...prev, field_label: e.target.value }))}
                    placeholder="Field label"
                  />
                </div>
                <div>
                  <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                  <Input
                    id="fieldPlaceholder"
                    value={newField.field_placeholder}
                    onChange={(e) => setNewField(prev => ({ ...prev, field_placeholder: e.target.value }))}
                    placeholder="Field placeholder"
                  />
                </div>
                
                {needsOptions && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {newField.field_options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            disabled={newField.field_options.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button onClick={addField} className="w-full">
                  Add Field
                </Button>
              </div>

              {/* Form Fields List */}
              <div className="space-y-2">
                <h4 className="font-medium">Form Fields</h4>
                {formFields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.field_label}</span>
                            {field.is_required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {fieldTypes.find(t => t.value === field.field_type)?.label}
                            </Badge>
                          </div>
                          {field.field_placeholder && (
                            <p className="text-sm text-muted-foreground">{field.field_placeholder}</p>
                          )}
                          {field.field_options.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Options: {field.field_options.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === formFields.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InsightFormBuilder;