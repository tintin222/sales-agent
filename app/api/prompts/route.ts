import { NextRequest, NextResponse } from 'next/server';
import { createSystemPrompt, getSystemPrompts, deactivatePrompts, getActiveCompanyId } from '@/lib/db/queries-wrapper';

const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    const prompts = await getSystemPrompts(COMPANY_ID);
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt_type, content } = await req.json();
    
    // Deactivate existing prompts of this type
    await deactivatePrompts(COMPANY_ID, prompt_type);
    
    // Create new active prompt
    const prompt = await createSystemPrompt(COMPANY_ID, prompt_type, content);
    
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}