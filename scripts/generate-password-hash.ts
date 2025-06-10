#!/usr/bin/env tsx

import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSQL to update user:');
  console.log(`UPDATE users SET password_hash = '${hash}' WHERE id = 2;`);
}

generateHash();