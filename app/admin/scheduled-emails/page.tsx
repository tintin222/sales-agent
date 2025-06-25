'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Send, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ScheduledEmail {
  id: number;
  conversation_id: number;
  client_email: string;
  subject: string;
  scheduled_send_at: string;
  schedule_status: string;
  content: string;
  conversation_status?: string;
}

export default function ScheduledEmailsPage() {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'sent' | 'failed'>('scheduled');

  const fetchScheduledEmails = useCallback(async () => {
    try {
      const response = await fetch(`/api/scheduled-emails?filter=${filter}`);
      const data = await response.json();
      setScheduledEmails(data);
    } catch (error) {
      console.error('Error fetching scheduled emails:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchScheduledEmails();
    // Refresh every 30 seconds
    const interval = setInterval(fetchScheduledEmails, 30000);
    return () => clearInterval(interval);
  }, [fetchScheduledEmails]);

  const cancelScheduled = async (messageId: number) => {
    if (!confirm('Are you sure you want to cancel this scheduled email?')) return;
    
    try {
      const response = await fetch(`/api/email/schedule/${messageId}/cancel`, {
        method: 'POST'
      });
      
      if (response.ok) {
        alert('Scheduled email cancelled');
        await fetchScheduledEmails();
      } else {
        alert('Failed to cancel scheduled email');
      }
    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      alert('Error cancelling scheduled email');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeUntilSend = (scheduledDate: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) return 'Sending soon...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else {
      return `in ${minutes} minutes`;
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Emails</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor scheduled email campaigns
          </p>
        </div>
        
        <button
          onClick={() => fetchScheduledEmails()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['scheduled', 'all', 'sent', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Scheduled Emails List */}
      <div className="bg-white rounded-lg shadow-md">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading scheduled emails...
          </div>
        ) : scheduledEmails.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {filter === 'all' ? '' : filter} emails found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {scheduledEmails.map((email) => (
              <div key={email.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{email.subject}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.schedule_status)}`}>
                        {getStatusIcon(email.schedule_status)}
                        <span className="ml-1">{email.schedule_status}</span>
                      </span>
                      {email.conversation_status && (
                        <span className="text-xs text-gray-500">
                          ({email.conversation_status})
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>To: {email.client_email}</p>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Scheduled for: {new Date(email.scheduled_send_at).toLocaleString()}
                        {email.schedule_status === 'scheduled' && (
                          <span className="ml-2 text-blue-600 font-medium">
                            ({getTimeUntilSend(email.scheduled_send_at)})
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        Preview message
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                        {email.content}
                      </div>
                    </details>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    <Link
                      href={`/dashboard/conversation/${email.conversation_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Thread
                    </Link>
                    {email.schedule_status === 'scheduled' && (
                      <button
                        onClick={() => cancelScheduled(email.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Cancel scheduled email"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {scheduledEmails.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Scheduled</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {scheduledEmails.filter(e => e.schedule_status === 'scheduled').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Sent Today</p>
                <p className="text-2xl font-semibold text-green-900">
                  {scheduledEmails.filter(e => {
                    if (e.schedule_status !== 'sent') return false;
                    const sentDate = new Date(e.scheduled_send_at);
                    const today = new Date();
                    return sentDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Next 24 Hours</p>
                <p className="text-2xl font-semibold text-amber-900">
                  {scheduledEmails.filter(e => {
                    if (e.schedule_status !== 'scheduled') return false;
                    const scheduled = new Date(e.scheduled_send_at);
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return scheduled <= tomorrow;
                  }).length}
                </p>
              </div>
              <Send className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}