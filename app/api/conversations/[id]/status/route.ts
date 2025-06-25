import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';
import { getUserFromRequest } from '@/lib/auth/get-user';

const COMPANY_ID = getActiveCompanyId();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const conversationId = parseInt(id);
    const { conversation_status } = await req.json();

    // Update conversation status
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ 
        conversation_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('company_id', COMPANY_ID);

    if (error) throw error;

    // If status is being changed to "waiting_for_client", update the timestamp
    if (conversation_status === 'waiting_for_client') {
      const { error: updateError } = await supabaseAdmin
        .from('conversations')
        .update({ 
          last_our_response_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .eq('company_id', COMPANY_ID);

      if (updateError) throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}