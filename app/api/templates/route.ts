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

    const { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, content, variables } = body;

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        company_id: COMPANY_ID,
        name,
        subject,
        content,
        variables: variables || []
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}