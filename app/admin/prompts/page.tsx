'use client';

import { useState, useEffect } from 'react';
import { Save, Plus } from 'lucide-react';

interface SystemPrompt {
  id: number;
  prompt_type: 'main' | 'clarification';
  content: string;
  is_active: boolean;
  created_at: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [mainPrompt, setMainPrompt] = useState('');
  const [clarificationPrompt, setClarificationPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();
      
      const main = data.find((p: SystemPrompt) => p.prompt_type === 'main' && p.is_active);
      const clarification = data.find((p: SystemPrompt) => p.prompt_type === 'clarification' && p.is_active);
      
      if (main) setMainPrompt(main.content);
      if (clarification) setClarificationPrompt(clarification.content);
      
      setPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    }
  };

  const savePrompt = async (type: 'main' | 'clarification') => {
    setSaving(true);
    const content = type === 'main' ? mainPrompt : clarificationPrompt;
    
    try {
      await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_type: type, content }),
      });
      await fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const defaultMainPrompt = `You are a helpful sales representative. Your task is to analyze pricing requests and generate professional quotes based on the provided pricing documents.

When responding:
1. Be professional and courteous
2. Provide clear pricing information
3. Explain any calculations or criteria used
4. Ask for clarification if information is missing
5. Include relevant terms and conditions`;

  const defaultClarificationPrompt = `You need additional information to provide an accurate quote. Please ask specific, clear questions to gather the necessary details.

Focus on:
1. Product/service specifications
2. Quantities needed
3. Delivery requirements
4. Special requirements or customizations`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Prompts</h1>
        <p className="mt-2 text-gray-600">
          Configure how the AI responds to pricing requests
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Main System Prompt</h2>
            <button
              onClick={() => setMainPrompt(defaultMainPrompt)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Use default
            </button>
          </div>
          
          <textarea
            value={mainPrompt}
            onChange={(e) => setMainPrompt(e.target.value)}
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the main system prompt..."
          />
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => savePrompt('main')}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Main Prompt'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Clarification Prompt</h2>
            <button
              onClick={() => setClarificationPrompt(defaultClarificationPrompt)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Use default
            </button>
          </div>
          
          <textarea
            value={clarificationPrompt}
            onChange={(e) => setClarificationPrompt(e.target.value)}
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the clarification prompt..."
          />
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => savePrompt('clarification')}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Clarification Prompt'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Prompt History</h2>
          <div className="space-y-3">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="border-l-4 border-gray-200 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{prompt.prompt_type} Prompt</span>
                  <span className="text-sm text-gray-500">
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prompt.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}