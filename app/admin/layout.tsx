import Link from 'next/link';
import { FileText, Settings, Users, MessageSquare, Bot, Mail, Calendar, MailIcon, UserCircle } from 'lucide-react';
import UserMenu from '@/components/user-menu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Sales Agent</h1>
          <p className="text-sm text-gray-600 mt-1">Administration</p>
        </div>
        
        <nav className="mt-6">
          <Link
            href="/admin/documents"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <FileText className="w-5 h-5 mr-3" />
            Pricing Documents
          </Link>
          
          <Link
            href="/admin/prompts"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings className="w-5 h-5 mr-3" />
            System Prompts
          </Link>
          
          <Link
            href="/admin/users"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Users className="w-5 h-5 mr-3" />
            Users
          </Link>
          
          <Link
            href="/admin/templates"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <MailIcon className="w-5 h-5 mr-3" />
            Email Templates
          </Link>
          
          <Link
            href="/admin/agents"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <UserCircle className="w-5 h-5 mr-3" />
            Virtual Agents
          </Link>
          
          <Link
            href="/admin/settings"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings className="w-4 h-4 mr-3" />
            Model Settings
          </Link>
          
          <Link
            href="/admin/email"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Mail className="w-5 h-5 mr-3" />
            Email Settings
          </Link>
          
          <Link
            href="/admin/automation"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Bot className="w-5 h-5 mr-3" />
            Email Automation
          </Link>
          
          <Link
            href="/admin/scheduled-emails"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Calendar className="w-5 h-5 mr-3" />
            Scheduled Emails
          </Link>
          
          <Link
            href="/dashboard"
            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Email Inbox
          </Link>
        </nav>
        
        <div className="mt-auto p-4 border-t">
          <UserMenu />
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}