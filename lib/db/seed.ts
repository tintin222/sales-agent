import pool from './client';

async function seedDatabase() {
  try {
    // Create a test company
    const companyResult = await pool.query(
      'INSERT INTO companies (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING *',
      ['Test Company']
    );
    
    const companyId = companyResult.rows[0]?.id || 1;
    
    // Create a test user
    await pool.query(
      'INSERT INTO users (company_id, email, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [companyId, 'admin@test.com', 'Admin User', 'admin']
    );
    
    // Create default system prompts
    const mainPrompt = `You are a helpful sales representative. Your task is to analyze pricing requests and generate professional quotes based on the provided pricing documents.

When responding:
1. Be professional and courteous
2. Provide clear pricing information
3. Explain any calculations or criteria used
4. Ask for clarification if information is missing
5. Include relevant terms and conditions`;

    const clarificationPrompt = `You need additional information to provide an accurate quote. Please ask specific, clear questions to gather the necessary details.

Focus on:
1. Product/service specifications
2. Quantities needed
3. Delivery requirements
4. Special requirements or customizations`;

    await pool.query(
      'INSERT INTO system_prompts (company_id, prompt_type, content) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [companyId, 'main', mainPrompt]
    );
    
    await pool.query(
      'INSERT INTO system_prompts (company_id, prompt_type, content) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [companyId, 'clarification', clarificationPrompt]
    );
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase();