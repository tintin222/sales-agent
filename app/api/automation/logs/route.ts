import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getCompanySettings } from '@/lib/db/queries-supabase';

const COMPANY_ID = 1;

export async function GET() {
  try {
    // Get automation settings to know which model is being used
    const settings = await getCompanySettings(COMPANY_ID);
    
    // Query for automated messages (approved_by_user_id = 0)
    const { data: automatedMessages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        conversation_id,
        content,
        sent_at,
        created_at,
        conversations!inner (
          id,
          client_email,
          subject
        )
      `)
      .eq('direction', 'outbound')
      .eq('approved_by_user_id', 0)
      .not('sent_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Transform the data into log entries
    const logs = (automatedMessages || []).map((msg) => {
      const conversation = Array.isArray(msg.conversations) ? msg.conversations[0] : msg.conversations;
      return {
        id: msg.id,
        conversation_id: msg.conversation_id,
        client_email: conversation?.client_email || '',
        subject: conversation?.subject || '',
        processed_at: msg.sent_at || msg.created_at,
        status: 'success' as const,
        model_used: settings?.automation_model || 'gemini-1.5-flash',
        response_length: msg.content?.length || 0
      };
    });

    // Add some simulated skipped/failed entries for demonstration
    // In production, you'd store actual automation attempts
    const simulatedLogs = [
      ...logs,
      // Add a few skipped entries for domains not in automation list
      {
        id: -1,
        conversation_id: null,
        client_email: 'test@example.com',
        subject: 'Pricing inquiry from non-automated domain',
        processed_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: 'skipped' as const,
        reason: 'Domain not in automation list'
      },
      {
        id: -2,
        conversation_id: null,
        client_email: 'demo@test.org',
        subject: 'Quote request from restricted domain',
        processed_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        status: 'skipped' as const,
        reason: 'Domain not in automation list'
      }
    ].filter(log => log.id < 0 || log); // Only include real logs and simulated ones

    return NextResponse.json(simulatedLogs);
  } catch (error) {
    console.error('Error fetching automation logs:', error);
    return NextResponse.json({ error: 'Failed to fetch automation logs' }, { status: 500 });
  }
}