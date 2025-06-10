import { NextRequest, NextResponse } from 'next/server';
import { getCompanySettings, upsertCompanySettings } from '@/lib/db/queries-supabase';

const COMPANY_ID = 1;

export async function GET() {
  try {
    const settings = await getCompanySettings(COMPANY_ID);
    
    // Return only email-related settings
    const emailSettings = {
      email_provider: settings?.email_provider || 'gmail',
      email_host: settings?.email_host || 'imap.gmail.com',
      email_port: settings?.email_port || 993,
      email_secure: settings?.email_secure ?? true,
      email_user: settings?.email_user || '',
      email_password: settings?.email_password ? '********' : '', // Mask password
      email_from: settings?.email_from || settings?.email_user || '',
      smtp_host: settings?.smtp_host || 'smtp.gmail.com',
      smtp_port: settings?.smtp_port || 587,
      smtp_secure: settings?.smtp_secure ?? false,
      smtp_user: settings?.smtp_user || settings?.email_user || '',
      smtp_password: settings?.smtp_password ? '********' : '', // Mask password
      oauth_client_id: settings?.oauth_client_id || '',
      oauth_client_secret: settings?.oauth_client_secret ? '********' : '',
      oauth_refresh_token: settings?.oauth_refresh_token ? '********' : ''
    };
    
    return NextResponse.json(emailSettings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json({ error: 'Failed to fetch email settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Only update password fields if they're not the masked value
    const updates: any = {
      email_provider: body.email_provider,
      email_host: body.email_host,
      email_port: body.email_port,
      email_secure: body.email_secure,
      email_user: body.email_user,
      email_from: body.email_from || body.email_user,
      smtp_host: body.smtp_host,
      smtp_port: body.smtp_port,
      smtp_secure: body.smtp_secure,
      smtp_user: body.smtp_user || body.email_user
    };
    
    // Only update passwords if they're provided and not masked
    if (body.email_password !== undefined && body.email_password !== '********') {
      updates.email_password = body.email_password;
      updates.smtp_password = body.smtp_password || body.email_password;
    }
    
    if (body.oauth_client_id) {
      updates.oauth_client_id = body.oauth_client_id;
    }
    
    if (body.oauth_client_secret && body.oauth_client_secret !== '********') {
      updates.oauth_client_secret = body.oauth_client_secret;
    }
    
    if (body.oauth_refresh_token && body.oauth_refresh_token !== '********') {
      updates.oauth_refresh_token = body.oauth_refresh_token;
    }
    
    const settings = await upsertCompanySettings(COMPANY_ID, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json({ error: 'Failed to save email settings' }, { status: 500 });
  }
}