'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Plus, Edit, Trash2, User } from 'lucide-react';
import { VirtualAgent } from '@/types';

export default function VirtualAgentsPage() {
  const [agents, setAgents] = useState<VirtualAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<VirtualAgent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    profile_photo_url: '',
    knowledge_base: '',
    writing_style: '',
    sample_responses: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data);
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
      const sample_responses = formData.sample_responses
        .split('\n\n')
        .map(r => r.trim())
        .filter(r => r);

      const url = selectedAgent 
        ? `/api/agents/${selectedAgent.id}`
        : '/api/agents';
      
      const method = selectedAgent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sample_responses: sample_responses.length > 0 ? sample_responses : null
        })
      });

      if (!response.ok) throw new Error('Failed to save agent');

      await fetchAgents();
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEdit = (agent: VirtualAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      profile_photo_url: agent.profile_photo_url || '',
      knowledge_base: agent.knowledge_base,
      writing_style: agent.writing_style,
      sample_responses: agent.sample_responses?.join('\n\n') || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this virtual agent?')) return;

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete agent');
      await fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetForm = () => {
    setSelectedAgent(null);
    setFormData({
      name: '',
      profile_photo_url: '',
      knowledge_base: '',
      writing_style: '',
      sample_responses: ''
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Virtual Sales Agents</h1>
          <p className="text-muted-foreground">Configure AI personalities for different sales scenarios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{selectedAgent ? 'Edit' : 'Create'} Virtual Agent</DialogTitle>
                <DialogDescription>
                  Define a virtual sales agent with specific knowledge and communication style
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah Johnson"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile_photo_url">Profile Photo URL (Optional)</Label>
                  <Input
                    id="profile_photo_url"
                    value={formData.profile_photo_url}
                    onChange={(e) => setFormData({ ...formData, profile_photo_url: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="knowledge_base">Knowledge Base</Label>
                  <Textarea
                    id="knowledge_base"
                    value={formData.knowledge_base}
                    onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                    placeholder="Describe what this agent knows about. e.g., Enterprise software solutions, SaaS pricing models, B2B sales strategies..."
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="writing_style">Writing Style</Label>
                  <Textarea
                    id="writing_style"
                    value={formData.writing_style}
                    onChange={(e) => setFormData({ ...formData, writing_style: e.target.value })}
                    placeholder="Describe the communication style. e.g., Professional yet friendly, consultative approach, uses data-driven insights..."
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sample_responses">Sample Responses (Optional)</Label>
                  <Textarea
                    id="sample_responses"
                    value={formData.sample_responses}
                    onChange={(e) => setFormData({ ...formData, sample_responses: e.target.value })}
                    placeholder="Provide sample responses separated by double line breaks.

Example response 1...

Example response 2..."
                    rows={8}
                  />
                  <p className="text-sm text-muted-foreground">
                    Separate each sample response with a double line break
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedAgent ? 'Update' : 'Create'} Agent
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No virtual agents created yet</p>
              <Button
                className="mt-4"
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first agent
              </Button>
            </CardContent>
          </Card>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={agent.profile_photo_url} alt={agent.name} />
                      <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                    </Avatar>
                    <CardTitle>{agent.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(agent)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Knowledge Base</h4>
                    <p className="text-sm text-muted-foreground">{agent.knowledge_base}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Writing Style</h4>
                    <p className="text-sm text-muted-foreground">{agent.writing_style}</p>
                  </div>
                  {agent.sample_responses && agent.sample_responses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Sample Responses</h4>
                      <p className="text-sm text-muted-foreground">
                        {agent.sample_responses.length} sample{agent.sample_responses.length > 1 ? 's' : ''} provided
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}