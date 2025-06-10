import { NextResponse } from 'next/server';
import { getCompanySettings, getActiveCompanyId } from '@/lib/db/queries-wrapper';
import { supabaseAdmin } from '@/lib/db/supabase';

const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    // Get automation settings
    const settings = await getCompanySettings(COMPANY_ID);
    
    if (!settings?.automation_enabled) {
      return NextResponse.json({
        isEnabled: false,
        message: 'Automation is disabled'
      });
    }

    // Get last automation run from recent automated messages
    const { data: lastAutomatedMessage } = await supabaseAdmin
      .from('messages')
      .select('created_at')
      .eq('direction', 'outbound')
      .eq('approved_by_user_id', 0)
      .not('sent_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Count emails processed in the last run (within the last interval period)
    const intervalMinutes = settings.automation_check_interval || 5;
    const cutoffTime = new Date(Date.now() - intervalMinutes * 60 * 1000 * 2);
    
    const { count: recentProcessed } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('direction', 'outbound')
      .eq('approved_by_user_id', 0)
      .not('sent_at', 'is', null)
      .gte('created_at', cutoffTime.toISOString());

    // Calculate next check time
    let lastCheck: Date | null = null;
    let nextCheck: Date | null = null;
    
    if (lastAutomatedMessage?.created_at) {
      lastCheck = new Date(lastAutomatedMessage.created_at);
      nextCheck = new Date(lastCheck.getTime() + intervalMinutes * 60 * 1000);
      
      // If next check is in the past, assume it will run soon
      if (nextCheck < new Date()) {
        nextCheck = new Date(Date.now() + 60 * 1000); // 1 minute from now
      }
    } else {
      // No previous runs, next check will be soon
      nextCheck = new Date(Date.now() + intervalMinutes * 60 * 1000);
    }

    return NextResponse.json({
      isEnabled: true,
      lastCheck: lastCheck?.toISOString(),
      nextCheck: nextCheck?.toISOString(),
      isRunning: false, // In a real implementation, you'd track this
      lastProcessed: recentProcessed || 0,
      checkInterval: intervalMinutes
    });

  } catch (error) {
    console.error('Error fetching automation status:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch automation status' 
    }, { status: 500 });
  }
}