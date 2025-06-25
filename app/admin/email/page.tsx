'use client';

import { useState, useEffect } from 'react';
import { Mail, Save, Eye, EyeOff, TestTube, Shield, Server } from 'lucide-react';

interface EmailSettings {
  email_provider?: 'gmail' | 'office365' | 'custom';
  email_host?: string;
  email_port?: number;
  email_secure?: boolean;
  email_user?: string;
  email_password?: string;
  email_from?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_user?: string;
  smtp_password?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
  oauth_refresh_token?: string;
}

const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 587, secure: false }
  },
  office365: {
    name: 'Microsoft Office 365',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false }
  },
  custom: {
    name: 'Custom Email Server',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 587, secure: false }
  }
};

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    email_provider: 'gmail'
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [passwordModified, setPasswordModified] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/email');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch {
      console.error('Error fetching email settings');
    }
  };

  const handleProviderChange = (provider: 'gmail' | 'office365' | 'custom') => {
    const providerConfig = EMAIL_PROVIDERS[provider];
    setSettings({
      ...settings,
      email_provider: provider,
      email_host: providerConfig.imap.host,
      email_port: providerConfig.imap.port,
      email_secure: providerConfig.imap.secure,
      smtp_host: providerConfig.smtp.host,
      smtp_port: providerConfig.smtp.port,
      smtp_secure: providerConfig.smtp.secure
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Only include password if it was modified
      const dataToSave = { ...settings };
      if (!passwordModified && settings.email_password === '********') {
        delete dataToSave.email_password;
        delete dataToSave.smtp_password;
      }
      
      const response = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        alert('Email settings saved successfully!');
        setPasswordModified(false);
        // Refresh settings to get the masked password
        await fetchSettings();
      } else {
        alert('Failed to save email settings');
      }
    } catch {
      console.error('Error saving email settings');
      alert('Error saving email settings');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      setTestResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Connection successful!' : 'Connection failed')
      });
    } catch {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Integration</h1>
        <p className="mt-2 text-gray-600">
          Configure email server settings for sending and receiving emails
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Provider Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Provider
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
              <button
                key={key}
                onClick={() => handleProviderChange(key as 'gmail' | 'office365' | 'custom')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  settings.email_provider === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{provider.name}</div>
                {key === 'gmail' && (
                  <p className="text-sm text-gray-500 mt-1">Use with App Password</p>
                )}
                {key === 'office365' && (
                  <p className="text-sm text-gray-500 mt-1">Exchange/Outlook support</p>
                )}
                {key === 'custom' && (
                  <p className="text-sm text-gray-500 mt-1">Any IMAP/SMTP server</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Authentication Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Authentication
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email_user || ''}
                onChange={(e) => setSettings({ ...settings, email_user: e.target.value, email_from: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {settings.email_provider === 'gmail' ? 'App Password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={settings.email_password || ''}
                  onChange={(e) => {
                    setSettings({ ...settings, email_password: e.target.value, smtp_password: e.target.value });
                    setPasswordModified(true);
                  }}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {settings.email_password === '********' && !passwordModified && (
                <p className="mt-1 text-xs text-amber-600">
                  Password is saved and hidden for security. Enter a new password to change it.
                </p>
              )}
              {settings.email_provider === 'gmail' && (
                <p className="mt-1 text-xs text-gray-500">
                  Use an App Password, not your regular password. 
                  <a 
                    href="https://support.google.com/accounts/answer/185833" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Learn how
                  </a>
                </p>
              )}
              {settings.email_provider === 'office365' && (
                <p className="mt-1 text-xs text-gray-500">
                  You may need to enable &quot;Authenticated SMTP&quot; in your Office 365 admin settings.
                </p>
              )}
            </div>
          </div>

          {/* OAuth Settings for Office 365 (optional) */}
          {settings.email_provider === 'office365' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3">OAuth 2.0 Authentication (Optional)</h3>
              <p className="text-sm text-blue-700 mb-4">
                For enhanced security, you can use OAuth 2.0 instead of username/password.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={settings.oauth_client_id || ''}
                    onChange={(e) => setSettings({ ...settings, oauth_client_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Azure AD App Client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Secret
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={settings.oauth_client_secret || ''}
                    onChange={(e) => setSettings({ ...settings, oauth_client_secret: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Azure AD App Secret"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Server Settings */}
        {settings.email_provider === 'custom' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              Server Configuration
            </h2>
            
            <div className="space-y-6">
              {/* IMAP Settings */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">IMAP Settings (Incoming Mail)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMAP Host
                    </label>
                    <input
                      type="text"
                      value={settings.email_host || ''}
                      onChange={(e) => setSettings({ ...settings, email_host: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IMAP Port
                    </label>
                    <input
                      type="number"
                      value={settings.email_port || 993}
                      onChange={(e) => setSettings({ ...settings, email_port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security
                    </label>
                    <select
                      value={settings.email_secure ? 'ssl' : 'none'}
                      onChange={(e) => setSettings({ ...settings, email_secure: e.target.value === 'ssl' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ssl">SSL/TLS</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SMTP Settings */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">SMTP Settings (Outgoing Mail)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.smtp_host || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.smtp_port || 587}
                      onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Security
                    </label>
                    <select
                      value={settings.smtp_secure ? 'tls' : 'none'}
                      onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.value === 'tls' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="tls">STARTTLS</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Connection */}
        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={testConnection}
            disabled={testing || !settings.email_user || !settings.email_password}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? 'Testing...' : 'Test Connection'}
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

      {/* Help Section */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Setup Instructions</h3>
        <div className="text-sm text-yellow-800 space-y-2">
          <div>
            <strong>Gmail:</strong>
            <ol className="list-decimal list-inside mt-1 ml-4">
              <li>Enable 2-factor authentication in your Google account</li>
              <li>Generate an App Password at myaccount.google.com/apppasswords</li>
              <li>Use the App Password instead of your regular password</li>
            </ol>
          </div>
          <div className="mt-3">
            <strong>Office 365:</strong>
            <ol className="list-decimal list-inside mt-1 ml-4">
              <li>Ensure SMTP AUTH is enabled in your Exchange admin center</li>
              <li>Use your full email address as username</li>
              <li>For OAuth, register an app in Azure AD with Mail.Send and Mail.Read permissions</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}