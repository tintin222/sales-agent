#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { createCompany, createUser, getUserByEmail, updateUserPassword } from '../lib/db/queries-supabase';
import { hashPassword } from '../lib/auth/config';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function createAdminUser() {
  console.log('🔐 Create Admin User\n');
  
  try {
    // Check if system is already set up
    const testEmail = 'admin@company.com';
    const existingUser = await getUserByEmail(testEmail);
    
    if (existingUser) {
      console.log('⚠️  System appears to be already set up.');
      const reset = await question('Do you want to reset the admin password? (y/n): ');
      
      if (reset.toLowerCase() === 'y') {
        const newPassword = await question('Enter new password (min 6 chars): ');
        if (newPassword.length < 6) {
          console.log('❌ Password must be at least 6 characters');
          process.exit(1);
        }
        
        const hashedPassword = await hashPassword(newPassword);
        await updateUserPassword(existingUser.id, hashedPassword);
        console.log('✅ Admin password updated successfully!');
        console.log(`\nLogin with: ${existingUser.email}`);
      }
      rl.close();
      return;
    }
    
    // Get company info
    const companyName = await question('Company name: ') || 'My Company';
    
    // Get admin info
    const adminName = await question('Admin name: ') || 'Admin User';
    const adminEmail = await question('Admin email: ') || 'admin@company.com';
    const adminPassword = await question('Admin password (min 6 chars): ') || 'admin123';
    
    if (adminPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      process.exit(1);
    }
    
    // Create company
    console.log('\n📦 Creating company...');
    const company = await createCompany(companyName);
    console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);
    
    // Create admin user
    console.log('\n👤 Creating admin user...');
    const user = await createUser(company.id, adminEmail, adminName, 'admin');
    
    // Set password
    const hashedPassword = await hashPassword(adminPassword);
    await updateUserPassword(user.id, hashedPassword);
    
    console.log(`✅ Admin user created: ${user.email}`);
    console.log('\n🎉 Setup complete! You can now login with:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
  }
}

createAdminUser();