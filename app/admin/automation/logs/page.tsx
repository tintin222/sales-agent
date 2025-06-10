'use client';

import { useState, useEffect } from 'react';
import { Bot, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import Link from 'next/link';

interface AutomationLog {
  id: number;
  conversation_id: number;
  client_email: string;
  subject: string;
  processed_at: string;
  status: 'success' | 'failed' | 'skipped';
  model_used?: string;
  response_length?: number;
  error_message?: string;
  reason?: string;
}

export default function AutomationLogsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'skipped'>('all');
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      // For now, we'll simulate logs based on automated messages
      // In a real implementation, you'd have a dedicated automation_logs table
      const response = await fetch('/api/automation/logs');
      const data = await response.json();
      
      // Calculate stats
      const newStats = {
        total: data.length,
        success: data.filter((log: AutomationLog) => log.status === 'success').length,
        failed: data.filter((log: AutomationLog) => log.status === 'failed').length,
        skipped: data.filter((log: AutomationLog) => log.status === 'skipped').length
      };
      
      setLogs(data);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching automation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'skipped':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bot className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.status === filter);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Automation Logs</h1>
        <p className="mt-2 text-gray-600">
          Track all automated email processing activities
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Processed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Successful</p>
              <p className="text-2xl font-semibold text-green-600">{stats.success}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Skipped</p>
              <p className="text-2xl font-semibold text-yellow-600">{stats.skipped}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex items-center space-x-2">
        <Filter className="w-5 h-5 text-gray-600" />
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Success ({stats.success})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'failed' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Failed ({stats.failed})
        </button>
        <button
          onClick={() => setFilter('skipped')}
          className={`px-3 py-1 rounded-md text-sm ${
            filter === 'skipped' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Skipped ({stats.skipped})
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading automation logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No automation logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        <span className="ml-1">{log.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.client_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{log.subject}</div>
                      {log.status === 'failed' && log.error_message && (
                        <div className="text-xs text-red-600 mt-1">{log.error_message}</div>
                      )}
                      {log.status === 'skipped' && log.reason && (
                        <div className="text-xs text-yellow-600 mt-1">{log.reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.model_used || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.processed_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.conversation_id && (
                        <Link
                          href={`/dashboard/conversation/${log.conversation_id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Thread
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Understanding Automation Logs</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Success:</strong> Email was processed and response sent automatically</li>
          <li><strong>Failed:</strong> Error occurred during processing (check error message)</li>
          <li><strong>Skipped:</strong> Email was from a domain not in the allowed list</li>
          <li>All automated responses are marked with a bot icon in conversations</li>
          <li>Logs are retained for 30 days for audit purposes</li>
        </ul>
      </div>
    </div>
  );
}