import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: agents, error } = await supabaseAdmin
      .from('virtual_agents')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, profile_photo_url, knowledge_base, writing_style, sample_responses } = body;

    if (!name || !knowledge_base || !writing_style) {
      return NextResponse.json({ 
        error: 'Name, knowledge base, and writing style are required' 
      }, { status: 400 });
    }

    const { data: agent, error } = await supabaseAdmin
      .from('virtual_agents')
      .insert({
        company_id: COMPANY_ID,
        name,
        profile_photo_url,
        knowledge_base,
        writing_style,
        sample_responses: sample_responses || []
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}