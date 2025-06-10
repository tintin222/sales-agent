'use client';

import { useState, useEffect } from 'react';
import { Save, Sparkles, Clock, Bell } from 'lucide-react';
import { GEMINI_MODELS, type GeminiModelId } from '@/lib/services/gemini';

interface CompanySettings {
  default_model?: GeminiModelId;
  temperature?: number;
  max_tokens?: number;
  follow_up_days_threshold?: number;
  follow_up_enabled?: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    default_model: 'gemini-1.5-pro',
    temperature: 0.7,
    max_tokens: 4096,
    follow_up_days_threshold: 3,
    follow_up_enabled: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
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
        alert('Settings saved successfully!');
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure default AI model and generation parameters
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Model Configuration
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Model
            </label>
            <select
              value={settings.default_model}
              onChange={(e) => setSettings({ ...settings, default_model: e.target.value as GeminiModelId })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GEMINI_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {GEMINI_MODELS.find(m => m.id === settings.default_model)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature (0.0 - 1.0)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Lower values make output more focused and deterministic
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              min="256"
              max="8192"
              step="256"
              value={settings.max_tokens}
              onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum length of the generated response
            </p>
          </div>

          <div className="pt-4">
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
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Follow-up Reminder Settings
        </h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.follow_up_enabled}
                onChange={(e) => setSettings({ ...settings, follow_up_enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable Follow-up Reminders
              </span>
            </label>
            <p className="mt-1 ml-7 text-sm text-gray-500">
              Show follow-up options when waiting for client responses
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Before Follow-up Reminder
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="1"
                max="14"
                value={settings.follow_up_days_threshold}
                onChange={(e) => setSettings({ ...settings, follow_up_days_threshold: parseInt(e.target.value) })}
                disabled={!settings.follow_up_enabled}
                className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-600">days</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Show reminder badge when client hasnt responded for this many days
            </p>
          </div>

          <div className="pt-4">
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
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Model Comparison</h2>
        <div className="space-y-4">
          {GEMINI_MODELS.map((model) => (
            <div key={model.id} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium">{model.name}</h3>
              <p className="text-sm text-gray-600">{model.description}</p>
              <p className="text-xs text-gray-500 mt-1">Model ID: {model.id}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}