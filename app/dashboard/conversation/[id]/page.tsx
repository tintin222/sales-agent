'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Sparkles, Loader, Clock, CheckCircle, AlertCircle, Bot, CircleDot, XCircle, User, FileText, Calendar, Edit, ChevronDown, ChevronUp, X, Paperclip } from 'lucide-react';
import { GEMINI_MODELS, type GeminiModelId } from '@/lib/services/gemini';
import QuickEditMessage from '@/components/quick-edit-message';
import ScheduleEmailDialog from '@/components/schedule-email-dialog';
import MessageAttachments from '@/components/message-attachments';
import { EmailTemplate, VirtualAgent } from '@/types';

interface Message {
  id: number;
  direction: 'inbound' | 'outbound';
  content: string;
  gemini_response?: string;
  final_response?: string;
  sent_at?: string;
  scheduled_send_at?: string;
  schedule_status?: string;
  attachment_count?: number;
  created_at: string;
  approved_by_user_id?: number;
  approved_by_user?: {
    name: string;
  };
}

interface Conversation {
  id: number;
  client_email: string;
  subject: string;
  status: string;
  conversation_status?: string;
  thread_id?: string;
  created_at?: string;
  last_our_response_at?: string;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = parseInt(params.id as string);
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>('gemini-1.5-pro');
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [changingStatus, setChangingStatus] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [agents, setAgents] = useState<VirtualAgent[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

  useEffect(() => {
    fetchConversation();
    fetchTemplatesAndAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const fetchConversation = async () => {
    try {
      // Fetch conversation details
      const convResponse = await fetch(`/api/conversations/${conversationId}`);
      const convData = await convResponse.json();
      setConversation(convData);
      
      // Set selected template and agent from conversation
      if (convData.selected_template_id) {
        setSelectedTemplateId(convData.selected_template_id);
      }
      if (convData.selected_agent_id) {
        setSelectedAgentId(convData.selected_agent_id);
      }
      
      // Fetch messages
      const msgResponse = await fetch(`/api/conversations/${conversationId}/messages`);
      const msgData = await msgResponse.json();
      setMessages(msgData);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplatesAndAgents = async () => {
    try {
      // Fetch templates
      const templateResponse = await fetch('/api/templates');
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        setTemplates(templateData);
      }
      
      // Fetch agents
      const agentResponse = await fetch('/api/agents');
      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        setAgents(agentData);
      }
    } catch (error) {
      console.error('Error fetching templates and agents:', error);
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditedContent(message.final_response || message.gemini_response || message.content);
  };

  const saveEdit = async (messageId: number) => {
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ final_response: editedContent })
      });
      
      setEditingMessageId(null);
      setEditedContent('');
      await fetchConversation();
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    }
  };

  const generateResponse = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          modelId: selectedModel,
          templateId: selectedTemplateId,
          agentId: selectedAgentId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Response generated successfully!');
        await fetchConversation();
      } else {
        alert(`Failed to generate response: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating response:', error);
      alert('Error generating response');
    } finally {
      setGenerating(false);
    }
  };

  const generateFollowUp = async () => {
    setGenerating(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/generate-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: 'gemini-1.5-flash' }) // Use fast model for follow-ups
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Follow-up message generated successfully!');
        await fetchConversation();
      } else {
        alert(`Failed to generate follow-up: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating follow-up:', error);
      alert('Error generating follow-up');
    } finally {
      setGenerating(false);
    }
  };

  const toggleMessageExpansion = (messageId: number) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const generateTimeline = () => {
    const events = messages.map((msg, index) => {
      const time = new Date(msg.created_at).toLocaleString();
      const content = msg.content.toLowerCase();
      
      if (msg.direction === 'inbound') {
        let description = 'Initial pricing request received';
        
        // Try to determine the nature of the client message
        if (index > 0) {
          if (content.includes('thank') || content.includes('accept') || content.includes('agree')) {
            description = 'Client accepted the quote';
          } else if (content.includes('date') || content.includes('when') || content.includes('delivery')) {
            description = 'Client provided timeline information';
          } else if (content.includes('quantity') || content.includes('how many') || content.includes('amount')) {
            description = 'Client specified quantities';
          } else if (content.includes('?')) {
            description = 'Client asked for clarification';
          } else {
            description = 'Client provided additional information';
          }
        }
        
        return {
          type: 'request',
          time,
          description,
          icon: <Mail className="w-4 h-4" />,
          color: 'text-blue-600'
        };
      } else {
        if (msg.sent_at) {
          let description = 'Pricing quote sent to client';
          if (content.includes('clarification') || content.includes('need') || content.includes('please provide')) {
            description = 'Requested clarification from client';
          }
          return {
            type: 'response',
            time,
            description,
            icon: <CheckCircle className="w-4 h-4" />,
            color: 'text-green-600'
          };
        } else {
          return {
            type: 'draft',
            time,
            description: 'Draft response ready for review',
            icon: <Clock className="w-4 h-4" />,
            color: 'text-yellow-600'
          };
        }
      }
    });
    return events.reverse(); // Show newest first
  };

  const getMessagePreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const sendEmail = async (messageId: number) => {
    setSelectedMessageId(messageId);
    setShowScheduleDialog(true);
  };

  const handleSendNow = async () => {
    if (!selectedMessageId) return;
    
    setShowScheduleDialog(false);
    setSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: selectedMessageId, conversationId })
      });
      
      if (response.ok) {
        alert('Email sent successfully!');
        await fetchConversation();
      } else {
        alert('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email');
    } finally {
      setSending(false);
      setSelectedMessageId(null);
    }
  };

  const handleScheduleEmail = async (scheduledDate: Date) => {
    if (!selectedMessageId) return;
    
    setShowScheduleDialog(false);
    setSending(true);
    try {
      const response = await fetch('/api/email/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageId: selectedMessageId, 
          conversationId,
          scheduledSendAt: scheduledDate.toISOString()
        })
      });
      
      if (response.ok) {
        alert(`Email scheduled for ${scheduledDate.toLocaleString()}`);
        await fetchConversation();
      } else {
        alert('Failed to schedule email');
      }
    } catch (error) {
      console.error('Error scheduling email:', error);
      alert('Error scheduling email');
    } finally {
      setSending(false);
      setSelectedMessageId(null);
    }
  };

  const updateConversationStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_status: newStatus })
      });
      
      if (response.ok) {
        await fetchConversation();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    } finally {
      setChangingStatus(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'waiting_for_client':
        return <Clock className="w-4 h-4" />;
      case 'negotiating':
        return <CircleDot className="w-4 h-4" />;
      case 'closed_won':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed_lost':
        return <XCircle className="w-4 h-4" />;
      case 'stale':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading conversation...</div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-8">
        <div className="text-center">Conversation not found</div>
      </div>
    );
  }

  // Check if we need to generate a response
  // Show generate button if the last message is inbound (client is waiting for response)
  const lastMessage = messages[messages.length - 1];
  const needsResponse = lastMessage?.direction === 'inbound';
  
  // Check if there's already an AI response being prepared for the last inbound message
  const lastInboundMessage = messages.filter(m => m.direction === 'inbound').pop();
  const hasUnsentResponse = messages.some(m => 
    m.direction === 'outbound' && 
    !m.sent_at && 
    m.created_at > (lastInboundMessage?.created_at || '')
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{conversation.subject}</h1>
            <p className="text-gray-600">From: {conversation.client_email}</p>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-500">Status: {conversation.status}</p>
              <span className="text-sm text-gray-500">•</span>
              <p className="text-sm text-gray-500">
                {messages.length} message{messages.length !== 1 ? 's' : ''} in thread
              </p>
              {needsResponse && (
                <>
                  <span className="text-sm text-gray-500">•</span>
                  <p className="text-sm text-orange-600 font-medium">
                    Client is waiting for response
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Conversation Status Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Conversation Status:</label>
            <div className="relative">
              <select
                value={conversation.conversation_status || 'active'}
                onChange={(e) => updateConversationStatus(e.target.value)}
                disabled={changingStatus}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="waiting_for_client">Waiting for Client</option>
                <option value="negotiating">Negotiating</option>
                <option value="closed_won">Closed - Won</option>
                <option value="closed_lost">Closed - Lost</option>
                <option value="stale">Stale</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                {changingStatus ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  getStatusIcon(conversation.conversation_status)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Client Messages</p>
              <p className="text-2xl font-semibold text-gray-900">
                {messages.filter(m => m.direction === 'inbound').length}
              </p>
            </div>
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sent Responses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {messages.filter(m => m.direction === 'outbound' && m.sent_at).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Draft Responses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {messages.filter(m => m.direction === 'outbound' && !m.sent_at).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Thread Age</p>
              <p className="text-2xl font-semibold text-gray-900">
                {conversation.created_at 
                  ? Math.floor((Date.now() - new Date(conversation.created_at).getTime()) / (1000 * 60 * 60)) 
                  : 0}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Generate Response Section */}
      {needsResponse && !hasUnsentResponse && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium mb-3 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
            Generate AI Response for Latest Message
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Email Template (Optional)
                </label>
                <select
                  value={selectedTemplateId || ''}
                  onChange={(e) => setSelectedTemplateId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None - Generate freely</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  Virtual Agent (Optional)
                </label>
                <select
                  value={selectedAgentId || ''}
                  onChange={(e) => setSelectedAgentId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None - Default personality</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Bot className="inline w-4 h-4 mr-1" />
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as GeminiModelId)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GEMINI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {selectedTemplateId && (
                  <p>Template: {templates.find(t => t.id === selectedTemplateId)?.name}</p>
                )}
                {selectedAgentId && (
                  <p>Agent: {agents.find(a => a.id === selectedAgentId)?.name}</p>
                )}
                <p>Model: {GEMINI_MODELS.find(m => m.id === selectedModel)?.description}</p>
              </div>
              
              <button
                onClick={generateResponse}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Response
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Show message if there's already an unsent response */}
      {needsResponse && hasUnsentResponse && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> There&apos;s already a draft response below waiting to be sent. 
            Please review and send it before generating a new response.
          </p>
        </div>
      )}

      {/* Follow-up Actions */}
      {conversation.conversation_status === 'waiting_for_client' && !needsResponse && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg">
          <h3 className="font-medium mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-amber-600" />
            Follow-up Actions
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Waiting for client response. You can send a polite follow-up reminder.
              </p>
              {conversation.last_our_response_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last response sent: {new Date(conversation.last_our_response_at).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <button
              onClick={() => generateFollowUp()}
              disabled={generating}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 flex items-center"
            >
              {generating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Follow-up
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Conversation Timeline Summary */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium text-gray-700 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Conversation Timeline
        </h3>
        <div className="space-y-3">
          {generateTimeline().map((event, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`${event.color} mt-0.5`}>{event.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{event.description}</p>
                <p className="text-xs text-gray-500">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation Messages (Newest First) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-700">Messages (Newest First)</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedMessages(new Set())}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Collapse All
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => setExpandedMessages(new Set(messages.map(m => m.id)))}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Expand All
            </button>
          </div>
        </div>
        {[...messages].reverse().map((message) => {
          const isExpanded = expandedMessages.has(message.id);
          const messageContent = message.final_response || message.gemini_response || message.content;
          const preview = getMessagePreview(messageContent);
          
          return (
            <div
              key={message.id}
              className={`border rounded-lg overflow-hidden ${
                message.direction === 'inbound'
                  ? 'border-gray-200 bg-white'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              {/* Message Header - Always Visible */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleMessageExpansion(message.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {message.direction === 'inbound' ? (
                        <>
                          <Mail className="w-5 h-5 text-gray-600" />
                          <span className="font-medium text-gray-900">Client</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-gray-900">AI Response</span>
                        </>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                      {message.sent_at && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Sent
                        </span>
                      )}
                      {message.approved_by_user && (
                        <span className="text-xs text-gray-500">
                          by {message.approved_by_user.name}
                        </span>
                      )}
                      {message.direction === 'outbound' && message.approved_by_user_id === 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800" title="This response was generated and sent automatically">
                          <Bot className="w-3 h-3 mr-1" />
                          Automated
                        </span>
                      )}
                      {message.direction === 'outbound' && !message.sent_at && !message.scheduled_send_at && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Draft
                        </span>
                      )}
                      {message.scheduled_send_at && message.schedule_status === 'scheduled' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Calendar className="w-3 h-3 mr-1" />
                          Scheduled: {new Date(message.scheduled_send_at).toLocaleString()}
                        </span>
                      )}
                      {message.attachment_count && message.attachment_count > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Paperclip className="w-3 h-3 mr-1" />
                          {message.attachment_count} attachment{message.attachment_count > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {preview}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                  {/* Action Buttons for Outbound Messages */}
                  {message.direction === 'outbound' && !message.sent_at && !editingMessageId && (
                    <div className="mb-4 flex items-center justify-end space-x-2">
                      {message.scheduled_send_at && message.schedule_status === 'scheduled' ? (
                        <>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Cancel scheduled email?')) {
                                await fetch(`/api/email/schedule/${message.id}/cancel`, { method: 'POST' });
                                await fetchConversation();
                              }
                            }}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel Schedule
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(message);
                            }}
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Quick Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendEmail(message.id);
                            }}
                            disabled={sending}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Send/Schedule
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  {editingMessageId === message.id ? (
                    <QuickEditMessage
                      content={editedContent}
                      onSave={(newContent) => {
                        setEditedContent(newContent);
                        saveEdit(message.id);
                      }}
                      onCancel={() => {
                        setEditingMessageId(null);
                        setEditedContent('');
                      }}
                    />
                  ) : (
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {messageContent}
                      </pre>
                    </div>
                  )}
                  
                  {/* Show attachments if any */}
                  {message.attachment_count && message.attachment_count > 0 && (
                    <MessageAttachments messageId={message.id} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Thread Status Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p className="font-medium mb-2">How this conversation works:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Each new email from the client will appear here automatically when you check emails</li>
          <li>Generate AI responses for each client message</li>
          <li>Review and edit responses before sending</li>
          <li>The AI sees the full conversation history for context</li>
          <li>Thread continues until the pricing discussion is complete</li>
        </ul>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push('/dashboard/inbox')}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Back to Inbox
        </button>
      </div>

      {/* Schedule Email Dialog */}
      <ScheduleEmailDialog
        isOpen={showScheduleDialog}
        onClose={() => {
          setShowScheduleDialog(false);
          setSelectedMessageId(null);
        }}
        onSchedule={handleScheduleEmail}
        onSendNow={handleSendNow}
      />
    </div>
  );
}