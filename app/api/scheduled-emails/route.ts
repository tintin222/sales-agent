import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';
import { getUserFromRequest } from '@/lib/auth/get-user';

const COMPANY_ID = getActiveCompanyId();

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'scheduled';

    // Build query
    let query = supabaseAdmin
      .from('messages')
      .select(`
        id,
        conversation_id,
        content,
        final_response,
        gemini_response,
        scheduled_send_at,
        schedule_status,
        sent_at,
        conversations!inner (
          id,
          client_email,
          subject,
          conversation_status,
          company_id
        )
      `)
      .eq('conversations.company_id', COMPANY_ID)
      .eq('direction', 'outbound')
      .not('scheduled_send_at', 'is', null)
      .order('scheduled_send_at', { ascending: true });

    // Apply filter
    if (filter === 'scheduled') {
      query = query.eq('schedule_status', 'scheduled');
    } else if (filter === 'sent') {
      query = query.eq('schedule_status', 'sent');
    } else if (filter === 'failed') {
      query = query.eq('schedule_status', 'failed');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format the response
    const formattedEmails = data?.map(msg => {
      const conversation = Array.isArray(msg.conversations) ? msg.conversations[0] : msg.conversations;
      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        client_email: conversation?.client_email || '',
        subject: conversation?.subject || '',
        scheduled_send_at: msg.scheduled_send_at,
        schedule_status: msg.schedule_status || 'scheduled',
        content: msg.final_response || msg.gemini_response || msg.content,
        conversation_status: conversation?.conversation_status,
        sent_at: msg.sent_at
      };
    }) || [];

    return NextResponse.json(formattedEmails);
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled emails' }, { status: 500 });
  }
}