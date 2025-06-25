import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/lib/db/queries-supabase';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await getConversationMessages(parseInt(id));
    
    // Enhance messages with user information
    if (messages && messages.length > 0) {
      const userIds = [...new Set(messages
        .filter((m: { approved_by_user_id?: number }) => m.approved_by_user_id)
        .map((m: { approved_by_user_id?: number }) => m.approved_by_user_id!))]; // Non-null assertion safe because we filtered
      
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
        
        const userMap = new Map(users?.map(u => [u.id, u]) || []);
        
        messages.forEach((msg: { approved_by_user_id?: number; approved_by_user?: unknown }) => {
          if (msg.approved_by_user_id && userMap.has(msg.approved_by_user_id)) {
            msg.approved_by_user = userMap.get(msg.approved_by_user_id);
          }
        });
      }
    }
    
    return NextResponse.json(messages || []);
  } catch {
    console.error('Error fetching messages');
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}