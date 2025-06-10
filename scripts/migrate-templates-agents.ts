import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running templates and agents migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../lib/db/migrations/add-templates-and-agents.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements and execute them one by one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error('Error executing statement:', error);
        throw error;
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Create sample data
    console.log('\nCreating sample email templates and virtual agents...');
    
    // Get the first company ID
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (companies && companies.length > 0) {
      const companyId = companies[0].id;
      
      // Create sample email templates
      const templates = [
        {
          company_id: companyId,
          name: 'Professional Quote',
          subject: 'Pricing Information for {product_name}',
          content: `Dear {client_name},

Thank you for your interest in {product_name}. Based on your requirements, I'm pleased to provide you with the following pricing information:

{pricing_details}

This quote is valid for 30 days from today's date. Please note that:
- Prices are subject to final confirmation based on specific configurations
- Volume discounts may apply for larger orders
- Additional services are available upon request

I'd be happy to schedule a call to discuss this quote in detail and answer any questions you may have.

Best regards,
{agent_name}`,
          variables: ['client_name', 'product_name', 'pricing_details', 'agent_name'],
          is_active: true
        },
        {
          company_id: companyId,
          name: 'Follow-up Template',
          subject: 'Following up on our pricing discussion',
          content: `Hi {client_name},

I wanted to follow up on the pricing information I sent over for {product_name}. 

Have you had a chance to review the quote? I'd be happy to address any questions or concerns you might have.

If you need any adjustments to the proposal or would like to explore different options, please let me know.

Looking forward to hearing from you.

Best regards,
{agent_name}`,
          variables: ['client_name', 'product_name', 'agent_name'],
          is_active: true
        }
      ];
      
      for (const template of templates) {
        const { error } = await supabase
          .from('email_templates')
          .insert(template);
        
        if (error) {
          console.error('Error creating template:', error);
        } else {
          console.log(`Created template: ${template.name}`);
        }
      }
      
      // Create sample virtual agents
      const agents = [
        {
          company_id: companyId,
          name: 'Sarah Johnson',
          profile_photo_url: null,
          knowledge_base: 'Enterprise software solutions, SaaS pricing models, B2B sales strategies, cloud infrastructure costs, implementation timelines, support packages',
          writing_style: 'Professional yet friendly, consultative approach, uses data-driven insights, focuses on value proposition, addresses pain points directly',
          sample_responses: [
            'Thank you for reaching out about our enterprise solution. Based on your team size and requirements, I recommend our Professional tier which includes...',
            'I understand that implementation timeline is crucial for your team. Typically, our onboarding process takes 2-3 weeks, including...'
          ],
          is_active: true
        },
        {
          company_id: companyId,
          name: 'Michael Chen',
          profile_photo_url: null,
          knowledge_base: 'Technical product specifications, API integrations, security compliance, performance metrics, scalability options, custom development',
          writing_style: 'Technical but accessible, detail-oriented, provides specific examples, addresses technical concerns proactively, includes relevant metrics',
          sample_responses: [
            'Great question about our API rate limits. Our standard tier supports up to 1000 requests per minute, with burst capacity of...',
            'Regarding security compliance, we maintain SOC 2 Type II certification and support GDPR requirements through...'
          ],
          is_active: true
        }
      ];
      
      for (const agent of agents) {
        const { error } = await supabase
          .from('virtual_agents')
          .insert(agent);
        
        if (error) {
          console.error('Error creating agent:', error);
        } else {
          console.log(`Created virtual agent: ${agent.name}`);
        }
      }
    }
    
    console.log('\nMigration and sample data creation completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();