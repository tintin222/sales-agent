import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/lib/services/document-parser';
import { createPricingDocument } from '@/lib/db/queries-supabase';

const COMPANY_ID = 1;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as 'criteria' | 'calculation' | 'general';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`Processing file: ${file.name}, type: ${documentType}, size: ${file.size} bytes`);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse document content
    let content: string;
    try {
      content = await parseDocument(buffer, file.name);
      console.log(`Successfully parsed document, content length: ${content.length} characters`);
    } catch (parseError: any) {
      console.error('Error parsing document:', parseError);
      return NextResponse.json({ 
        error: `Failed to parse document: ${parseError.message}. Please ensure the file is valid.` 
      }, { status: 400 });
    }
    
    // Save to database
    const document = await createPricingDocument(
      COMPANY_ID,
      documentType,
      file.name,
      content
    );
    
    console.log(`Document saved to database with ID: ${document.id}`);
    
    return NextResponse.json(document);
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload document' 
    }, { status: 500 });
  }
}