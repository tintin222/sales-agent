import { NextRequest, NextResponse } from 'next/server';
import { getCompanySettings, upsertCompanySettings, getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    const settings = await getCompanySettings(COMPANY_ID) || {
      default_model: 'gemini-1.5-pro',
      temperature: 0.7,
      max_tokens: 4096,
      automation_enabled: false,
      automation_model: 'gemini-1.5-flash',
      automation_check_interval: 5,
      automation_domains: []
    };
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const settings = await upsertCompanySettings(COMPANY_ID, {
      default_model: body.default_model,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      automation_enabled: body.automation_enabled,
      automation_model: body.automation_model,
      automation_check_interval: body.automation_check_interval,
      automation_domains: body.automation_domains
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}