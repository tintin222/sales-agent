'use client';

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, Eye, Clock, Bot, AlertCircle, CheckCircle, XCircle, CircleDot } from 'lucide-react';
import Link from 'next/link';

interface EmailConversation {
  id: number;
  client_email: string;
  subject: string;
  status: string;
  conversation_status?: string;
  created_at: string;
  updated_at: string;
  thread_id?: string;
  hasAutomatedMessages?: boolean;
  last_client_response_at?: string;
  last_our_response_at?: string;
  days_since_last_response?: number;
  lastMessage?: {
    content: string;
    direction: string;
    created_at: string;
  };
  messages?: any[];
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<EmailConversation[]>([]);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations/email');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEmails = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/email/check');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check emails');
      }
      
      if (data.processed > 0) {
        alert(`Processed ${data.processed} new email(s)`);
        await fetchConversations();
      } else {
        alert('No new emails found in the last 7 days');
      }
    } catch (error: any) {
      console.error('Error checking emails:', error);
      alert(`Failed to check emails: ${error.message || 'Unknown error'}`);
    } finally {
      setChecking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'awaiting_info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_review': return <Clock className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getConversationStatusBadge = (convStatus?: string) => {
    switch (convStatus) {
      case 'waiting_for_client':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Waiting for client
          </span>
        );
      case 'negotiating':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CircleDot className="w-3 h-3 mr-1" />
            Negotiating
          </span>
        );
      case 'closed_won':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Won
          </span>
        );
      case 'closed_lost':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Lost
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Stale
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Inbox</h1>
          <p className="mt-2 text-gray-600">
            Manage email conversations and pricing requests
          </p>
        </div>
        
        <div className="text-right">
          <button
            onClick={checkEmails}
            disabled={checking}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check New Emails'}
          </button>
          <p className="text-xs text-gray-500 mt-1">Checks emails from last 7 days</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No email conversations yet. Click &quot;Check New Emails&quot; to fetch emails.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/dashboard/conversation/${conversation.id}`}
                className="block p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900">
                        {conversation.subject}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                        {getStatusIcon(conversation.status)}
                        <span className="ml-1">{conversation.status.replace('_', ' ')}</span>
                      </span>
                      {getConversationStatusBadge(conversation.conversation_status)}
                      {conversation.hasAutomatedMessages && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800" title="Contains automated responses">
                          <Bot className="w-3 h-3 mr-1" />
                          Automated
                        </span>
                      )}
                      {conversation.lastMessage?.direction === 'inbound' && conversation.status !== 'sent' && !['closed_won', 'closed_lost'].includes(conversation.conversation_status || '') && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Needs Response
                        </span>
                      )}
                      {conversation.days_since_last_response && conversation.days_since_last_response >= 3 && conversation.conversation_status === 'waiting_for_client' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {conversation.days_since_last_response} days waiting
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 text-sm text-gray-600">
                      From: {conversation.client_email}
                    </div>
                    
                    {conversation.lastMessage && (
                      <div className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {conversation.lastMessage.direction === 'inbound' ? '→ ' : '← '}
                        {conversation.lastMessage.content}
                      </div>
                    )}
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Last updated: {new Date(conversation.updated_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}