'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user info from API since httpOnly cookies can't be read client-side
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser({ email: data.email, role: data.role });
      })
      .catch(err => {
        console.error('Failed to fetch user info:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="px-3 py-2 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <User className="w-5 h-5 text-gray-600" />
        <span className="text-sm text-gray-700">{user.email}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-700">
                <div className="font-medium">{user.email}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
              </div>
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}