'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, File, Image, FileAudio, FileVideo, Loader2 } from 'lucide-react';
import { MessageAttachment } from '@/types';

interface MessageAttachmentsProps {
  messageId: number;
}

export default function MessageAttachments({ messageId }: MessageAttachmentsProps) {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/${messageId}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return Image;
    if (contentType.startsWith('audio/')) return FileAudio;
    if (contentType.startsWith('video/')) return FileVideo;
    if (contentType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = (attachment: MessageAttachment) => {
    // Open in new tab or download
    window.open(`/api/attachments/${messageId}/${attachment.filename}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="text-sm font-medium mb-2">Attachments ({attachments.length})</h4>
      <div className="space-y-2">
        {attachments.map((attachment) => {
          const Icon = getFileIcon(attachment.content_type || 'application/octet-stream');
          
          return (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
              onClick={() => handleDownload(attachment)}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{attachment.filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size || 0)}
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-gray-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
}