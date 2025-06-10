#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db/supabase';
import fs from 'fs';
import path from 'path';

async function migrateEmailSettings() {
  console.log('🔄 Migrating email settings...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../lib/db/add-email-settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    console.log('Adding email columns to company_settings table...');
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't work, try direct approach
      console.log('Direct SQL execution not available, using individual column additions...');
      
      const columns = [
        { name: 'email_provider', type: 'VARCHAR(50)', default: "'gmail'" },
        { name: 'email_host', type: 'VARCHAR(255)' },
        { name: 'email_port', type: 'INTEGER' },
        { name: 'email_secure', type: 'BOOLEAN', default: 'true' },
        { name: 'email_user', type: 'VARCHAR(255)' },
        { name: 'email_password', type: 'TEXT' },
        { name: 'email_from', type: 'VARCHAR(255)' },
        { name: 'smtp_host', type: 'VARCHAR(255)' },
        { name: 'smtp_port', type: 'INTEGER' },
        { name: 'smtp_secure', type: 'BOOLEAN', default: 'true' },
        { name: 'smtp_user', type: 'VARCHAR(255)' },
        { name: 'smtp_password', type: 'TEXT' },
        { name: 'oauth_client_id', type: 'TEXT' },
        { name: 'oauth_client_secret', type: 'TEXT' },
        { name: 'oauth_refresh_token', type: 'TEXT' },
        { name: 'oauth_access_token', type: 'TEXT' },
        { name: 'oauth_token_expiry', type: 'TIMESTAMP' }
      ];
      
      console.log('\n⚠️  Manual migration required!');
      console.log('Please run the following SQL in your Supabase SQL editor:\n');
      console.log(sql);
      console.log('\nOr run these commands individually:\n');
      
      for (const col of columns) {
        const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
        console.log(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${defaultClause};`);
      }
    } else {
      console.log('✅ Email settings columns added successfully!');
    }
    
    // Check if we need to migrate from environment variables
    if (process.env.IMAP_USER && process.env.SMTP_USER) {
      console.log('\n📧 Found email credentials in environment variables');
      console.log('Migrating to database...');
      
      const { data: settings } = await supabaseAdmin
        .from('company_settings')
        .select('*')
        .eq('company_id', 1)
        .single();
      
      if (settings && !settings.email_user) {
        const { error: updateError } = await supabaseAdmin
          .from('company_settings')
          .update({
            email_provider: 'gmail',
            email_host: process.env.IMAP_HOST || 'imap.gmail.com',
            email_port: parseInt(process.env.IMAP_PORT || '993'),
            email_secure: true,
            email_user: process.env.IMAP_USER,
            email_password: process.env.IMAP_PASS,
            email_from: process.env.SMTP_USER,
            smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtp_port: parseInt(process.env.SMTP_PORT || '587'),
            smtp_secure: false,
            smtp_user: process.env.SMTP_USER,
            smtp_password: process.env.SMTP_PASS
          })
          .eq('company_id', 1);
        
        if (updateError) {
          console.error('Failed to migrate email settings:', updateError);
        } else {
          console.log('✅ Email settings migrated from environment variables!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateEmailSettings();