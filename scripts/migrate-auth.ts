#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db/supabase';
import fs from 'fs';
import path from 'path';

async function migrateAuth() {
  console.log('🔐 Applying authentication migrations...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../lib/db/add-auth-fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 SQL to execute:');
    console.log(sql);
    console.log('\n⚠️  Please run the above SQL in your Supabase SQL editor.\n');
    
    // Check if password_hash column exists
    const { data: columns } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    if (columns && columns.length > 0) {
      const hasPasswordHash = 'password_hash' in columns[0];
      console.log(`Password hash column exists: ${hasPasswordHash ? 'Yes' : 'No'}`);
      
      if (!hasPasswordHash) {
        console.log('\n❗ IMPORTANT: You need to add the password_hash column to the users table.');
        console.log('Run this SQL in Supabase:');
        console.log('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);');
      }
    }
    
    console.log('\n✅ Migration check complete!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

migrateAuth();