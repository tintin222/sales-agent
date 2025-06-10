import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiContext, Message } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro (Preview)', description: 'Latest and most capable model for complex tasks' },
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash (Preview)', description: 'Newest fast model with improved capabilities' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Very fast model, excellent for simple queries' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Proven model for complex pricing calculations' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Balanced speed and capability' },
  { id: 'gemini-pro', name: 'Gemini Pro', description: 'Legacy model, stable performance' },
] as const;

export type GeminiModelId = typeof GEMINI_MODELS[number]['id'];

export async function generatePricingResponse(
  context: GeminiContext, 
  modelId: GeminiModelId = 'gemini-1.5-pro'
): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: modelId,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    }
  });

  const prompt = buildPrompt(context);
  
  try {
    console.log(`Generating response using model: ${modelId}`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error(`Gemini API error with model ${modelId}:`, error);
    
    // If model not found, try with default model
    if (error.message?.includes('model') && modelId !== 'gemini-1.5-pro') {
      console.log('Falling back to gemini-1.5-pro');
      return generatePricingResponse(context, 'gemini-1.5-pro');
    }
    
    throw new Error(`Failed to generate pricing response: ${error.message}`);
  }
}

function buildPrompt(context: GeminiContext): string {
  let prompt = context.systemPrompt + '\n\n';
  
  // Add pricing criteria
  if (context.pricingDocuments.criteria) {
    prompt += '## PRICING CRITERIA\n\n';
    prompt += context.pricingDocuments.criteria + '\n\n';
  }
  
  // Add pricing calculations
  if (context.pricingDocuments.calculations) {
    prompt += '## PRICING CALCULATIONS\n\n';
    prompt += context.pricingDocuments.calculations + '\n\n';
  }
  
  // Add additional documents
  if (context.pricingDocuments.additional.length > 0) {
    prompt += '## ADDITIONAL INFORMATION\n\n';
    context.pricingDocuments.additional.forEach((doc, index) => {
      prompt += `### Document ${index + 1}\n\n${doc}\n\n`;
    });
  }
  
  // Add email thread
  prompt += '## CONVERSATION HISTORY\n\n';
  context.emailThread.forEach(message => {
    const sender = message.direction === 'inbound' ? 'Client' : 'Company';
    prompt += `**${sender}:** ${message.content}\n\n`;
  });
  
  // Add instruction
  prompt += '## TASK\n\n';
  prompt += 'Based on the pricing criteria, calculations, and the client\'s request above, ';
  prompt += 'please generate a professional pricing quote response. ';
  prompt += 'If you need additional information from the client, ';
  prompt += 'clearly list the specific questions that need to be answered.\n\n';
  prompt += 'Your response should be ready to send directly to the client.';
  
  return prompt;
}