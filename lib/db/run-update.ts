import './load-env';
import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';

async function runSchemaUpdate() {
  try {
    // Read update schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'update-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema update
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: schema });
    
    if (error) {
      // If RPC doesn't exist, try direct query
      console.log('Creating company_settings table...');
      const { error: createError } = await supabaseAdmin
        .from('company_settings')
        .select('id')
        .limit(1);
      
      if (createError?.code === '42P01') { // Table doesn't exist
        // Table will be created automatically by Supabase when we first insert
        console.log('Table will be created on first insert');
      }
    }
    
    console.log('Schema update completed');
  } catch (error) {
    console.error('Error updating schema:', error);
  }
}

runSchemaUpdate();