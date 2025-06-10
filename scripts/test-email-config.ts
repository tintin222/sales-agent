#!/usr/bin/env tsx

import { getEmailSettings } from '../lib/services/email';
import nodemailer from 'nodemailer';

async function testEmailConfig() {
  console.log('🔧 Testing Email Configuration...\n');
  
  try {
    // Get email settings
    const settings = await getEmailSettings();
    
    console.log('📧 Email Settings:');
    console.log(`- Provider: ${settings.provider}`);
    console.log(`- Email User: ${settings.from}`);
    console.log(`- IMAP Host: ${settings.imap.host}:${settings.imap.port}`);
    console.log(`- SMTP Host: ${settings.smtp.host}:${settings.smtp.port}`);
    console.log(`- Has Password: ${settings.imap.password ? 'Yes' : 'No'}`);
    console.log('');
    
    if (!settings.imap.password) {
      console.error('❌ No password configured! Please set your email password in the Email Settings page.');
      return;
    }
    
    // Test SMTP connection
    console.log('📤 Testing SMTP connection...');
    try {
      const transporter = nodemailer.createTransport(settings.smtp);
      await transporter.verify();
      console.log('✅ SMTP connection successful!');
      
      // Get transporter info
      const info = transporter.transporter || {};
      console.log(`   Using: ${info.name || 'SMTP'} transport`);
    } catch (smtpError: any) {
      console.error('❌ SMTP connection failed:', smtpError.message);
      console.error('   Please check your SMTP settings and password.');
    }
    
    console.log('\n💡 Tips:');
    console.log('- For Gmail: Use an App Password, not your regular password');
    console.log('- For Office 365: Enable "Authenticated SMTP" in admin settings');
    console.log('- Make sure your firewall allows outbound connections on SMTP port');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testEmailConfig();