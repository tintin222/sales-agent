#!/usr/bin/env tsx

// Script to manually test email automation
// Run with: npm run test:automation

async function testAutomation() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🤖 Testing Email Automation...\n');
  
  try {
    // First, enable automation
    console.log('1️⃣ Enabling automation...');
    const enableResponse = await fetch(`${baseUrl}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automation_enabled: true,
        automation_model: 'gemini-1.5-flash',
        automation_check_interval: 5,
        automation_domains: [] // Empty array means all domains
      })
    });
    
    if (!enableResponse.ok) {
      throw new Error('Failed to enable automation');
    }
    
    console.log('✅ Automation enabled\n');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check automation status
    console.log('2️⃣ Checking automation status...');
    const statusResponse = await fetch(`${baseUrl}/api/automation/status`);
    const status = await statusResponse.json();
    console.log('Status:', status);
    console.log('');
    
    // Run automated email check
    console.log('3️⃣ Running automated email check...');
    const checkResponse = await fetch(`${baseUrl}/api/email/check-automated`);
    const result = await checkResponse.json();
    
    if (!checkResponse.ok) {
      throw new Error(result.error || result.message || 'Failed to check emails');
    }
    
    console.log('\n📊 Results:');
    console.log(`- Processed: ${result.processed} emails`);
    console.log(`- Success: ${result.details?.filter((d: any) => d.automated).length || 0} automated responses`);
    console.log(`- Skipped: ${result.details?.filter((d: any) => d.reason).length || 0} emails`);
    
    if (result.details && result.details.length > 0) {
      console.log('\n📧 Email Details:');
      result.details.forEach((detail: any, index: number) => {
        console.log(`\n${index + 1}. ${detail.subject}`);
        console.log(`   From: ${detail.from}`);
        console.log(`   Status: ${detail.automated ? '✅ Automated' : detail.reason ? `⏭️ Skipped (${detail.reason})` : '❌ Failed'}`);
        if (detail.conversationId) {
          console.log(`   View: ${baseUrl}/dashboard/conversation/${detail.conversationId}`);
        }
      });
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure the Next.js development server is running (npm run dev)');
  }
}

// Run the test
testAutomation();