'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Mail } from 'lucide-react';
import { EmailTemplate } from '@/types';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    variables: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const variables = formData.variables
        .split(',')
        .map(v => v.trim())
        .filter(v => v);

      const url = selectedTemplate 
        ? `/api/templates/${selectedTemplate.id}`
        : '/api/templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: variables.length > 0 ? variables : null
        })
      });

      if (!response.ok) throw new Error('Failed to save template');

      await fetchTemplates();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject || '',
      content: template.content,
      variables: template.variables?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete template');
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      subject: '',
      content: '',
      variables: ''
    });
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Manage email templates for AI-generated responses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{selectedTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
                <DialogDescription>
                  Create templates that can be used when generating email responses
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Follow-up Email"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Email Subject (Optional)</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Following up on our conversation"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Template Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your email template here. You can use variables like {client_name}, {product_name}, etc."
                    rows={10}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="variables">Variables (comma-separated)</Label>
                  <Input
                    id="variables"
                    value={formData.variables}
                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                    placeholder="e.g., client_name, product_name, price"
                  />
                  <p className="text-sm text-muted-foreground">
                    Define variables that can be replaced in the template
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedTemplate ? 'Update' : 'Create'} Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates created yet</p>
              <Button
                className="mt-4"
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    {template.subject && (
                      <CardDescription>Subject: {template.subject}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                  {template.content}
                </pre>
                {template.variables && template.variables.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}