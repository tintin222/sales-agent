import { Pool } from 'pg';

// Direct connection to Supabase
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || 'your-database-password';
const connectionString = `postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.zmbbdfuruzabiwwdpsrr.supabase.co:5432/postgres`;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;