import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Edit, Save, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

interface TemplateTask {
  id: string;
  template_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  order_index: number;
}

const ChecklistBuilder = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [templateTasks, setTemplateTasks] = useState<TemplateTask[]>([]);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    role: '',
    department: ''
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as const
  });
  const { toast } = useToast();

  const roles = ['exiting', 'successor', 'hr-manager', 'admin'];
  const departments = ['Sales', 'Engineering', 'HR', 'Marketing', 'Finance', 'Operations'];
  const priorities = ['low', 'medium', 'high', 'critical'] as const;

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive'
      });
      return;
    }

    setTemplates(data || []);
  };

  const fetchTemplateTasks = async (templateId: string) => {
    const { data, error } = await supabase
      .from('checklist_template_tasks')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch template tasks',
        variant: 'destructive'
      });
      return;
    }

    setTemplateTasks((data || []).map(task => ({
      ...task,
      priority: task.priority as 'low' | 'medium' | 'high' | 'critical'
    })));
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.role) {
      toast({
        title: 'Error',
        description: 'Name and role are required',
        variant: 'destructive'
      });
      return;
    }

    const { data, error } = await supabase
      .from('checklist_templates')
      .insert({
        name: newTemplate.name,
        description: newTemplate.description,
        role: newTemplate.role,
        department: newTemplate.department
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

    setNewTemplate({ name: '', description: '', role: '', department: '' });
    fetchTemplates();
    toast({
      title: 'Success',
      description: 'Template created successfully'
    });
  };

  const updateTemplate = async () => {
    if (!selectedTemplate) return;

    const { error } = await supabase
      .from('checklist_templates')
      .update({
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        role: selectedTemplate.role,
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

  const addTask = async () => {
    if (!selectedTemplate || !newTask.title) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive'
      });
      return;
    }

    const maxOrder = Math.max(...templateTasks.map(t => t.order_index), 0);

    const { error } = await supabase
      .from('checklist_template_tasks')
      .insert({
        template_id: selectedTemplate.id,
        title: newTask.title,
        description: newTask.description,
        category: newTask.category,
        priority: newTask.priority,
        order_index: maxOrder + 1
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add task',
        variant: 'destructive'
      });
      return;
    }

    setNewTask({ title: '', description: '', category: '', priority: 'medium' });
    fetchTemplateTasks(selectedTemplate.id);
    toast({
      title: 'Success',
      description: 'Task added successfully'
    });
  };

  const updateTask = async (task: TemplateTask) => {
    const { error } = await supabase
      .from('checklist_template_tasks')
      .update({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority
      })
      .eq('id', task.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
      return;
    }

    setEditingTask(null);
    fetchTemplateTasks(selectedTemplate!.id);
    toast({
      title: 'Success',
      description: 'Task updated successfully'
    });
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('checklist_template_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
      return;
    }

    fetchTemplateTasks(selectedTemplate!.id);
    toast({
      title: 'Success',
      description: 'Task deleted successfully'
    });
  };

  const moveTask = async (taskId: string, direction: 'up' | 'down') => {
    const taskIndex = templateTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    if (newIndex < 0 || newIndex >= templateTasks.length) return;

    const updates = [
      {
        id: templateTasks[taskIndex].id,
        order_index: templateTasks[newIndex].order_index
      },
      {
        id: templateTasks[newIndex].id,
        order_index: templateTasks[taskIndex].order_index
      }
    ];

    for (const update of updates) {
      await supabase
        .from('checklist_template_tasks')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    fetchTemplateTasks(selectedTemplate!.id);
  };

  const selectTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplate(false);
    fetchTemplateTasks(template.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Checklist Builder</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage role-specific handover checklists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <Card className="glass-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Checklist Templates</CardTitle>
            <CardDescription className="text-xs">Manage role-specific handover templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* New Template Form */}
            <div className="space-y-3 p-4 border border-border/60 rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium text-foreground">Create New Template</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Template name"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newTemplate.role}
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newTemplate.department}
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{template.role}</Badge>
                        {template.department && (
                          <Badge variant="secondary" className="text-xs">{template.department}</Badge>
                        )}
                      </div>
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

        {/* Template Tasks */}
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
              {/* Add New Task */}
              <div className="space-y-3 p-4 border border-border/60 rounded-lg bg-muted/30">
                <h4 className="text-sm font-medium text-foreground">Add New Task</h4>
                <div>
                  <Label htmlFor="taskTitle">Title</Label>
                  <Input
                    id="taskTitle"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newTask.category}
                      onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Task category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value: any) => setNewTask(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea
                    id="taskDescription"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Task description"
                    rows={2}
                  />
                </div>
                <Button onClick={addTask} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                <h4 className="font-medium">Template Tasks ({templateTasks.length})</h4>
                {templateTasks.map((task, index) => (
                  <div key={task.id} className="p-3 border rounded-lg">
                    {editingTask === task.id ? (
                      <div className="space-y-3">
                        <Input
                          value={task.title}
                          onChange={(e) => setTemplateTasks(prev => 
                            prev.map(t => t.id === task.id ? { ...t, title: e.target.value } : t)
                          )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={task.category}
                            onChange={(e) => setTemplateTasks(prev => 
                              prev.map(t => t.id === task.id ? { ...t, category: e.target.value } : t)
                            )}
                            placeholder="Category"
                          />
                          <Select
                            value={task.priority}
                            onValueChange={(value: any) => setTemplateTasks(prev => 
                              prev.map(t => t.id === task.id ? { ...t, priority: value } : t)
                            )}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorities.map(priority => (
                                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Textarea
                          value={task.description || ''}
                          onChange={(e) => setTemplateTasks(prev => 
                            prev.map(t => t.id === task.id ? { ...t, description: e.target.value } : t)
                          )}
                          placeholder="Description"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateTask(task)}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTask(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{task.title}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                {task.priority}
                              </Badge>
                              {task.category && (
                                <Badge variant="outline" className="text-xs">{task.category}</Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => moveTask(task.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => moveTask(task.id, 'down')}
                              disabled={index === templateTasks.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setEditingTask(task.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
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

export default ChecklistBuilder;