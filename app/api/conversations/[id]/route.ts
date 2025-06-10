import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}