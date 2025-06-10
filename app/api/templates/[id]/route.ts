import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', COMPANY_ID)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, content, variables, is_active } = body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .update(updateData)
      .eq('id', params.id)
      .eq('company_id', COMPANY_ID)
      .select()
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', COMPANY_ID)
      .select('id');

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}