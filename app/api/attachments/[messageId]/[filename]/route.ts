import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { supabaseAdmin } from '@/lib/db/supabase';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string; filename: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = parseInt(params.messageId);

    // Verify user has access to this message
    const { data: message } = await supabaseAdmin
      .from('messages')
      .select('conversation_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get attachment metadata
    const { data: attachment } = await supabaseAdmin
      .from('message_attachments')
      .select('*')
      .eq('message_id', messageId)
      .eq('filename', params.filename)
      .single();

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Check if using Supabase Storage
    if (process.env.USE_SUPABASE_STORAGE === 'true' && attachment.storage_url) {
      // Redirect to Supabase Storage URL
      return NextResponse.redirect(attachment.storage_url);
    }

    // Serve from local storage
    const filePath = path.join(process.cwd(), attachment.storage_path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.content_type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
        'Content-Length': attachment.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving attachment:', error);
    return NextResponse.json({ error: 'Failed to serve attachment' }, { status: 500 });
  }
}