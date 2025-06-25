'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface PricingDocument {
  id: number;
  name: string;
  document_type: 'criteria' | 'calculation' | 'general';
  is_active: boolean;
  created_at: string;
  content_preview?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<PricingDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<'criteria' | 'calculation' | 'general'>('criteria');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedType);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchDocuments();
        e.target.value = '';
        alert('Document uploaded successfully!');
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error uploading document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleDocumentStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      await fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const deleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'criteria': return 'bg-blue-100 text-blue-800';
      case 'calculation': return 'bg-green-100 text-green-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pricing Documents</h1>
        <p className="mt-2 text-gray-600">
          Upload and manage your pricing criteria, calculation rules, and other documents
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as 'criteria' | 'calculation' | 'general')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="criteria">Pricing Criteria</option>
            <option value="calculation">Pricing Calculations</option>
            <option value="general">General Information</option>
          </select>

          <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
            <Upload className="w-5 h-5 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.pdf,.docx,.txt,.md"
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          Supported formats: Excel (.xlsx, .xls), PDF, Word (.docx), Text (.txt), Markdown (.md)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Document Library</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No documents uploaded yet. Upload your first document to get started.
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-gray-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <div className="mt-1 flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.document_type)}`}>
                          {doc.document_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.content_preview && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {doc.content_preview}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleDocumentStatus(doc.id, doc.is_active)}
                      className="p-2 hover:bg-gray-100 rounded-md"
                      title={doc.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {doc.is_active ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 hover:bg-gray-100 rounded-md text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}