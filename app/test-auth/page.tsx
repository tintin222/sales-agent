'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<any>(null);

  useEffect(() => {
    // Check if we have an auth token
    const checkAuth = async () => {
      const cookies = document.cookie;
      const hasAuthToken = cookies.includes('auth-token');
      
      setAuthStatus({
        cookies,
        hasAuthToken,
        timestamp: new Date().toISOString()
      });
    };
    
    checkAuth();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Auth Status:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>
      
      <div className="space-x-4">
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go to Login
        </button>
        
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Go to Dashboard
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}