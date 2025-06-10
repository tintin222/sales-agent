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
        .filter((m: any) => m.approved_by_user_id)
        .map((m: any) => m.approved_by_user_id))];
      
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', userIds);
        
        const userMap = new Map(users?.map(u => [u.id, u]) || []);
        
        messages.forEach((msg: any) => {
          if (msg.approved_by_user_id && userMap.has(msg.approved_by_user_id)) {
            msg.approved_by_user = userMap.get(msg.approved_by_user_id);
          }
        });
      }
    }
    
    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}