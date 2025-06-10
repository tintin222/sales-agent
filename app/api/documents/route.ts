import { NextRequest, NextResponse } from 'next/server';
import { getActivePricingDocuments, createPricingDocument, getActiveCompanyId } from '@/lib/db/queries-wrapper';

// Get the active company ID (handles demo mode)
const COMPANY_ID = getActiveCompanyId();

export async function GET() {
  try {
    const documents = await getActivePricingDocuments(COMPANY_ID);
    
    // Add content preview (first 200 chars)
    const documentsWithPreview = documents.map(doc => ({
      ...doc,
      content_preview: doc.content_text.substring(0, 200) + '...'
    }));
    
    return NextResponse.json(documentsWithPreview);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, documentType, content } = await req.json();
    
    const document = await createPricingDocument(
      COMPANY_ID,
      documentType,
      name,
      content
    );
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}