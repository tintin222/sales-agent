'use client';

import { useState } from 'react';
import { Play, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AutomationTriggerPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ processed: number; details?: Array<{ subject: string; from: string; automated: boolean; reason?: string; conversationId?: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAutomation = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await fetch('/api/email/check-automated');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to run automation');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manual Automation Trigger</h1>
            <p className="mt-2 text-gray-600">
              Manually run the email automation process for testing
            </p>
          </div>
          <Link
            href="/admin/automation"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Settings
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Run Automation Now</h2>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to manually trigger the automation process. 
            This will check for new emails and automatically generate and send responses 
            based on your configuration.
          </p>
          
          <button
            onClick={runAutomation}
            disabled={running}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {running ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Running Automation...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Run Automation Now
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Automation Completed Successfully
            </h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Processed: {result.processed} emails</p>
              <p>• Automated responses: {result.details?.filter((d) => d.automated).length || 0}</p>
              <p>• Skipped: {result.details?.filter((d) => d.reason).length || 0}</p>
            </div>
            
            {result.details && result.details.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-green-900 mb-2">Details:</h4>
                <div className="space-y-2">
                  {result.details.map((detail, index) => (
                    <div key={index} className="p-2 bg-white rounded border border-green-200">
                      <p className="text-sm font-medium">{detail.subject}</p>
                      <p className="text-xs text-gray-600">From: {detail.from}</p>
                      <p className="text-xs">
                        Status: {detail.automated ? '✅ Automated' : detail.reason ? `⏭️ Skipped: ${detail.reason}` : '❌ Failed'}
                      </p>
                      {detail.conversationId && (
                        <Link
                          href={`/dashboard/conversation/${detail.conversationId}`}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Conversation →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-900 mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Error Running Automation
            </h3>
            <p className="text-sm text-red-800">{error}</p>
            <p className="text-xs text-red-600 mt-2">
              Make sure automation is enabled in the settings and you have valid configuration.
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Testing Instructions</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Make sure automation is enabled in the settings</li>
          <li>Configure your AI model and domain filters</li>
          <li>Send a test email to your configured Gmail account</li>
          <li>Click &quot;Run Automation Now&quot; to process the email</li>
          <li>Check the results and view the conversation</li>
        </ol>
      </div>

      {/* Alternative Testing Methods */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Alternative Testing Methods</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>1. Command Line:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            npm run test:automation
          </pre>
          
          <p className="mt-3"><strong>2. Direct API Call:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            curl http://localhost:3000/api/email/check-automated
          </pre>
          
          <p className="mt-3"><strong>3. Cron Job (for production):</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            */5 * * * * curl http://localhost:3000/api/email/check-automated
          </pre>
        </div>
      </div>
    </div>
  );
}