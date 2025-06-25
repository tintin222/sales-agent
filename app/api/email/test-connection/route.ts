import { NextRequest, NextResponse } from 'next/server';
import * as Imap from 'imap-simple';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const settings = await req.json();
    
    // Test IMAP connection
    const imapConfig = {
      imap: {
        user: settings.email_user,
        password: settings.email_password,
        host: settings.email_host || 'imap.gmail.com',
        port: settings.email_port || 993,
        tls: settings.email_secure !== false,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    try {
      console.log('Testing IMAP connection...');
      const connection = await Imap.connect(imapConfig);
      await connection.end();
      console.log('IMAP connection successful');
    } catch (imapError) {
      console.error('IMAP connection failed:', imapError);
      return NextResponse.json({ 
        message: `IMAP connection failed: ${imapError instanceof Error ? imapError.message : 'Unknown error'}. Please check your incoming mail settings.`
      }, { status: 400 });
    }

    // Test SMTP connection
    const smtpConfig = {
      host: settings.smtp_host || settings.email_host || 'smtp.gmail.com',
      port: settings.smtp_port || 587,
      secure: settings.smtp_port === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtp_user || settings.email_user,
        pass: settings.smtp_password || settings.email_password
      }
    };

    try {
      console.log('Testing SMTP connection...');
      const transporter = nodemailer.createTransport(smtpConfig);
      await transporter.verify();
      console.log('SMTP connection successful');
    } catch (smtpError) {
      console.error('SMTP connection failed:', smtpError);
      return NextResponse.json({ 
        message: `SMTP connection failed: ${smtpError instanceof Error ? smtpError.message : 'Unknown error'}. Please check your outgoing mail settings.`
      }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Email connection test successful! Both IMAP and SMTP are working correctly.' 
    });
    
  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Failed to test email connection' 
    }, { status: 500 });
  }
}