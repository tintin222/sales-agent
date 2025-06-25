import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { data: agent, error } = await supabaseAdmin
      .from('virtual_agents')
      .select('*')
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch {
    console.error('Error fetching agent');
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, profile_photo_url, knowledge_base, writing_style, sample_responses, is_active } = body;

    const updateData: {
      updated_at: string;
      name?: string;
      profile_photo_url?: string;
      knowledge_base?: string;
      writing_style?: string;
      sample_responses?: string;
      is_active?: boolean;
    } = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updateData.name = name;
    if (profile_photo_url !== undefined) updateData.profile_photo_url = profile_photo_url;
    if (knowledge_base !== undefined) updateData.knowledge_base = knowledge_base;
    if (writing_style !== undefined) updateData.writing_style = writing_style;
    if (sample_responses !== undefined) updateData.sample_responses = sample_responses;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: agent, error } = await supabaseAdmin
      .from('virtual_agents')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .select()
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch {
    console.error('Error updating agent');
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('virtual_agents')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .select('id');

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error('Error deleting agent');
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 });
  }
}