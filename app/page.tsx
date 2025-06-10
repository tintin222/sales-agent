import Link from 'next/link';
import { ArrowRight, FileText, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Sales Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automate your pricing quotes with AI-powered responses using Gemini's large context window
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <FileText className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Document-Based Pricing</h3>
            <p className="text-gray-600">
              Upload your pricing documents and let AI understand your pricing structure
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Zap className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Instant Responses</h3>
            <p className="text-gray-600">
              Generate accurate pricing quotes in seconds using Gemini's advanced AI
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <Shield className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Human Oversight</h3>
            <p className="text-gray-600">
              Review and approve all responses before sending to ensure accuracy
            </p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          <Link
            href="/admin/documents"
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
          >
            Admin Panel
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}