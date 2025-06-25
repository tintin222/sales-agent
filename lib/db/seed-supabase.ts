import './load-env';
import { 
  createCompany, 
  createUser, 
  createSystemPrompt,
  deactivatePrompts 
} from './queries-supabase';

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Create a test company
    let companyId = 1;
    try {
      const company = await createCompany('Test Company');
      companyId = company.id;
      console.log('Created company:', company);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') { // Unique violation
        console.log('Company already exists, using ID 1');
      } else {
        throw error;
      }
    }
    
    // Create a test user
    try {
      const user = await createUser(companyId, 'admin@test.com', 'Admin User', 'admin');
      console.log('Created user:', user);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === '23505') { // Unique violation
        console.log('User already exists');
      } else {
        throw error;
      }
    }
    
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

    // Deactivate existing prompts and create new ones
    await deactivatePrompts(companyId, 'main');
    const mainPromptResult = await createSystemPrompt(companyId, 'main', mainPrompt);
    console.log('Created main prompt:', mainPromptResult);
    
    await deactivatePrompts(companyId, 'clarification');
    const clarificationPromptResult = await createSystemPrompt(companyId, 'clarification', clarificationPrompt);
    console.log('Created clarification prompt:', clarificationPromptResult);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase().catch(console.error);