import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET() {
  try {
    // Check if any users exist
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({
      isSetup: (count || 0) > 0
    });

  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json({ isSetup: false });
  }
}