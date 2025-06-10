'use client';

import { useState, useEffect } from 'react';

export default function DebugCookiesPage() {
  const [cookies, setCookies] = useState<string[]>([]);
  const [apiCookies, setApiCookies] = useState<any>(null);

  useEffect(() => {
    // Get client-side cookies
    const allCookies = document.cookie.split(';').filter(c => c.trim());
    setCookies(allCookies);

    // Check server-side cookies
    fetch('/api/auth/test-cookie')
      .then(res => res.json())
      .then(data => setApiCookies(data));
  }, []);

  const testSetCookie = async () => {
    const res = await fetch('/api/auth/test-cookie', { method: 'POST' });
    const data = await res.json();
    alert('Test cookie set. Refresh the page to see if it appears.');
  };

  const testLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'admin123'
      })
    });
    const data = await res.json();
    console.log('Login response:', data);
    alert(`Login response: ${JSON.stringify(data)}`);
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cookie Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Client-side Cookies (document.cookie)</h2>
        <div className="bg-gray-100 p-4 rounded">
          {cookies.length > 0 ? (
            <ul className="space-y-1">
              {cookies.map((cookie, i) => (
                <li key={i} className="font-mono text-sm">{cookie}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No cookies found</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Server-side Cookie Check</h2>
        <div className="bg-gray-100 p-4 rounded">
          {apiCookies ? (
            <pre className="font-mono text-sm">{JSON.stringify(apiCookies, null, 2)}</pre>
          ) : (
            <p className="text-gray-500">Loading...</p>
          )}
        </div>
      </div>

      <div className="space-x-4">
        <button
          onClick={testSetCookie}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Set Cookie
        </button>
        <button
          onClick={testLogin}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Login
        </button>
      </div>
    </div>
  );
}