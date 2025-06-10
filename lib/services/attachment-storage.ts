import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { supabaseAdmin } from '../db/supabase';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// For production, you might want to use cloud storage like S3, Supabase Storage, etc.
// This implementation uses local file storage for simplicity

export interface AttachmentStorage {
  filename: string;
  contentType: string;
  size: number;
  storagePath: string;
  storageUrl?: string;
}

// Store attachment locally
export async function storeAttachmentLocal(
  messageId: number,
  filename: string,
  content: Buffer,
  contentType: string
): Promise<AttachmentStorage> {
  // Create directory structure: attachments/[messageId]/[filename]
  const baseDir = path.join(process.cwd(), 'attachments');
  const messageDir = path.join(baseDir, messageId.toString());
  
  // Ensure directories exist
  await mkdir(baseDir, { recursive: true });
  await mkdir(messageDir, { recursive: true });
  
  // Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = path.join(messageDir, sanitizedFilename);
  const relativePath = path.relative(process.cwd(), storagePath);
  
  // Write file
  await writeFile(storagePath, content);
  
  return {
    filename: sanitizedFilename,
    contentType,
    size: content.length,
    storagePath: relativePath,
    storageUrl: `/api/attachments/${messageId}/${sanitizedFilename}`
  };
}

// Store attachment using Supabase Storage (recommended for production)
export async function storeAttachmentSupabase(
  messageId: number,
  filename: string,
  content: Buffer,
  contentType: string
): Promise<AttachmentStorage> {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `attachments/${messageId}/${sanitizedFilename}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin
    .storage
    .from('message-attachments')
    .upload(storagePath, content, {
      contentType,
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload attachment: ${error.message}`);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin
    .storage
    .from('message-attachments')
    .getPublicUrl(storagePath);
  
  return {
    filename: sanitizedFilename,
    contentType,
    size: content.length,
    storagePath: data.path,
    storageUrl: publicUrl
  };
}

// Save attachment metadata to database
export async function saveAttachmentMetadata(
  messageId: number,
  attachment: AttachmentStorage
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('message_attachments')
    .insert({
      message_id: messageId,
      filename: attachment.filename,
      content_type: attachment.contentType,
      size: attachment.size,
      storage_path: attachment.storagePath,
      storage_url: attachment.storageUrl
    });
  
  if (error) {
    throw new Error(`Failed to save attachment metadata: ${error.message}`);
  }
  
  // Update attachment count on message
  await supabaseAdmin
    .from('messages')
    .update({ attachment_count: await getAttachmentCount(messageId) })
    .eq('id', messageId);
}

// Get attachment count for a message
async function getAttachmentCount(messageId: number): Promise<number> {
  const { count } = await supabaseAdmin
    .from('message_attachments')
    .select('*', { count: 'exact', head: true })
    .eq('message_id', messageId);
  
  return count || 0;
}

// Get attachments for a message
export async function getMessageAttachments(messageId: number) {
  const { data, error } = await supabaseAdmin
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to get attachments: ${error.message}`);
  }
  
  return data;
}

// Main function to store email attachments
export async function storeEmailAttachments(
  messageId: number,
  attachments: Array<{ filename: string; content: Buffer; contentType: string }>
): Promise<void> {
  // Choose storage method based on environment
  const useSupabaseStorage = process.env.USE_SUPABASE_STORAGE === 'true';
  
  for (const attachment of attachments) {
    try {
      let stored: AttachmentStorage;
      
      if (useSupabaseStorage) {
        stored = await storeAttachmentSupabase(
          messageId,
          attachment.filename,
          attachment.content,
          attachment.contentType
        );
      } else {
        stored = await storeAttachmentLocal(
          messageId,
          attachment.filename,
          attachment.content,
          attachment.contentType
        );
      }
      
      await saveAttachmentMetadata(messageId, stored);
    } catch (error) {
      console.error(`Failed to store attachment ${attachment.filename}:`, error);
      // Continue with other attachments even if one fails
    }
  }
}