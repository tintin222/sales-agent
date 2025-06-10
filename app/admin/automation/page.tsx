'use client';

import { useState, useEffect } from 'react';
import { Save, Bot, Clock, Shield, Play, Pause, FileText, Zap } from 'lucide-react';
import { GEMINI_MODELS, type GeminiModelId } from '@/lib/services/gemini';
import Link from 'next/link';

interface AutomationSettings {
  automation_enabled?: boolean;
  automation_model?: GeminiModelId;
  automation_check_interval?: number;
  automation_domains?: string[];
}

interface AutomationStatus {
  lastCheck?: string;
  nextCheck?: string;
  isRunning?: boolean;
  lastProcessed?: number;
}

export default function AutomationPage() {
  const [settings, setSettings] = useState<AutomationSettings>({
    automation_enabled: false,
    automation_model: 'gemini-1.5-flash',
    automation_check_interval: 5,
    automation_domains: []
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [status, setStatus] = useState<AutomationStatus>({});

  useEffect(() => {
    fetchSettings();
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          automation_enabled: data.automation_enabled || false,
          automation_model: data.automation_model || 'gemini-1.5-flash',
          automation_check_interval: data.automation_check_interval || 5,
          automation_domains: data.automation_domains || []
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/automation/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching automation status:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Automation settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const testAutomation = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/email/check-automated');
      const data = await response.json();
      
      if (data.success) {
        alert(`Automation test completed!\nProcessed: ${data.processed} emails\n${
          data.details?.filter((d: { automated?: boolean }) => d.automated).length || 0
        } automated responses sent`);
      } else {
        alert(`Automation test failed: ${data.message || data.error}`);
      }
    } catch (error) {
      console.error('Error testing automation:', error);
      alert('Error testing automation');
    } finally {
      setTesting(false);
    }
  };

  const addDomain = () => {
    if (domainInput && !settings.automation_domains?.includes(domainInput)) {
      setSettings({
        ...settings,
        automation_domains: [...(settings.automation_domains || []), domainInput]
      });
      setDomainInput('');
    }
  };

  const removeDomain = (domain: string) => {
    setSettings({
      ...settings,
      automation_domains: settings.automation_domains?.filter(d => d !== domain) || []
    });
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Automation</h1>
            <p className="mt-2 text-gray-600">
              Configure automatic email processing and response generation
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href="/admin/automation/trigger"
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Manual Trigger
            </Link>
            <Link
              href="/admin/automation/logs"
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Automation Status */}
      <div className={`mb-6 p-4 rounded-lg ${
        settings.automation_enabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {settings.automation_enabled ? (
              <Play className="w-6 h-6 text-green-600" />
            ) : (
              <Pause className="w-6 h-6 text-gray-400" />
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                Automation is {settings.automation_enabled ? 'Active' : 'Inactive'}
              </h3>
              <p className="text-sm text-gray-600">
                {settings.automation_enabled 
                  ? `Checking emails every ${settings.automation_check_interval} minutes`
                  : 'Enable to automatically process and respond to emails'
                }
              </p>
              {settings.automation_enabled && status.lastCheck && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p>Last check: {new Date(status.lastCheck).toLocaleString()}</p>
                  {status.nextCheck && (
                    <p>Next check: {new Date(status.nextCheck).toLocaleString()}</p>
                  )}
                  {status.lastProcessed !== undefined && (
                    <p>Processed in last run: {status.lastProcessed} emails</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSettings({ ...settings, automation_enabled: !settings.automation_enabled })}
            className={`px-4 py-2 rounded-md ${
              settings.automation_enabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {settings.automation_enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* AI Model Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            AI Model Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Automation Model
              </label>
              <select
                value={settings.automation_model}
                onChange={(e) => setSettings({ ...settings, automation_model: e.target.value as GeminiModelId })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GEMINI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {GEMINI_MODELS.find(m => m.id === settings.automation_model)?.description}
              </p>
              <p className="mt-1 text-sm text-yellow-600">
                💡 Tip: Use faster models (Flash) for automation to reduce costs and improve speed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.automation_check_interval}
                onChange={(e) => setSettings({ ...settings, automation_check_interval: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                How often to check for new emails (1-60 minutes)
              </p>
            </div>
          </div>
        </div>

        {/* Domain Filtering */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Domain Filtering
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Domains (leave empty to allow all)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDomain()}
                  placeholder="example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addDomain}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>

            {settings.automation_domains && settings.automation_domains.length > 0 && (
              <div className="space-y-2">
                {settings.automation_domains.map((domain) => (
                  <div key={domain} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{domain}</span>
                    <button
                      onClick={() => removeDomain(domain)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              Only emails from these domains will be processed automatically.
              Leave empty to process all emails.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={testAutomation}
            disabled={testing || !settings.automation_enabled}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            {testing ? 'Testing...' : 'Test Automation Now'}
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          How Automation Works
        </h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>System automatically checks for new emails at the specified interval</li>
          <li>Generates responses using the selected AI model</li>
          <li>Sends responses immediately without human review</li>
          <li>Continues email threads automatically</li>
          <li>You can still review all conversations in the dashboard</li>
        </ul>
      </div>
    </div>
  );
}