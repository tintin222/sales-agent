import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    // Get conversations with their latest message and automation info
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        messages (
          content,
          direction,
          created_at,
          approved_by_user_id
        )
      `)
      .eq('company_id', COMPANY_ID)
      .order('updated_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    // Format conversations with last message and automation info
    const formattedConversations = conversations?.map(conv => {
      const sortedMessages = conv.messages?.sort((a: { created_at: string }, b: { created_at: string }) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) || [];
      
      // Check if any outbound messages were automated (approved_by_user_id = 0)
      const hasAutomatedMessages = sortedMessages.some((msg: { direction: string; approved_by_user_id?: number }) => 
        msg.direction === 'outbound' && msg.approved_by_user_id === 0
      );
      
      // Calculate days since last response if waiting for client
      let daysSinceLastResponse = null;
      if (conv.last_client_response_at && conv.conversation_status === 'waiting_for_client') {
        const lastResponseDate = new Date(conv.last_client_response_at);
        const now = new Date();
        daysSinceLastResponse = Math.floor((now.getTime() - lastResponseDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        ...conv,
        lastMessage: sortedMessages[0] || null,
        hasAutomatedMessages,
        days_since_last_response: daysSinceLastResponse,
        messages: undefined // Remove full messages array from response
      };
    });
    
    return NextResponse.json(formattedConversations || []);
  } catch {
    console.error('Error fetching email conversations');
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}