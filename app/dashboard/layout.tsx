import Link from 'next/link';
import { Inbox, Settings } from 'lucide-react';
import UserMenu from '@/components/user-menu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Sales Agent</h1>
          <p className="text-sm text-gray-600 mt-1">Dashboard</p>
        </div>
        
        <nav className="mt-6">
          <Link
            href="/dashboard/inbox"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Inbox className="w-5 h-5 mr-3" />
            Email Inbox
          </Link>
          
          <Link
            href="/admin/documents"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings className="w-5 h-5 mr-3" />
            Admin Panel
          </Link>
        </nav>
        
        <div className="mt-auto p-4 border-t">
          <UserMenu />
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}