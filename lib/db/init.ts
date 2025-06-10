import pool from './client';
import fs from 'fs';
import path from 'path';

export async function initializeDatabase() {
  try {
    // Read schema file
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}