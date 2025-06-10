# Sales Agent - Context-Based Pricing Quote System

## System Overview

A simplified sales automation system that leverages Gemini's large context window to process pricing requests by sending all relevant documents and information in a single context.

## Core Architecture Principles

- **No RAG/Vector DB**: Utilize Gemini's large context window (up to 2M tokens)
- **Simple Document Storage**: Store pricing documents as text/markdown
- **Single-Shot Processing**: Send everything to Gemini in one request
- **Human-in-the-Loop**: All responses reviewed before sending

## Database Schema (Simplified)

```sql
-- Companies
companies (
  id, name, created_at
)

-- Pricing context documents
pricing_documents (
  id, company_id, 
  document_type (criteria/calculation/general),
  name, content_text, -- Full document content as text
  is_active, created_at
)

-- Email conversations
conversations (
  id, company_id, client_email,
  subject, status (pending_review/approved/sent),
  created_at
)

-- Messages
messages (
  id, conversation_id, 
  direction (inbound/outbound),
  content, 
  gemini_response, -- LLM generated response
  final_response, -- Human edited response
  approved_by_user_id,
  sent_at
)

-- Users (sales reps)
users (
  id, company_id, email, name, role
)

-- System prompts
system_prompts (
  id, company_id,
  prompt_type (main/clarification),
  content, is_active
)
```

## Key Components

### 1. Admin Panel
```
/admin
  /documents - Upload and manage pricing documents
  /prompts - Configure system prompts
  /users - Manage sales team
```

### 2. Document Management
- Upload Excel/PDF/Word documents
- System extracts text content (tables preserved as markdown)
- Store as plain text for Gemini context
- Activate/deactivate documents

### 3. Email Processing Flow

```
Incoming Email
    ↓
Extract Content
    ↓
Build Gemini Context:
  - System Prompt
  - All Active Pricing Documents
  - Current Email Thread
  - Request: "Generate pricing response"
    ↓
Send to Gemini API (single request)
    ↓
Receive Complete Response
    ↓
Human Review & Edit
    ↓
Send to Client
```

### 4. Gemini Context Structure

```typescript
interface GeminiContext {
  systemPrompt: string;
  pricingCriteria: string;
  pricingCalculations: string;
  additionalDocuments: string[];
  emailThread: Message[];
  instruction: string;
}

// Example context size:
// - System prompt: ~500 tokens
// - Pricing documents: ~50,000 tokens
// - Email thread: ~2,000 tokens
// - Total: Well within 2M token limit
```

### 5. Sales Rep Interface
```
/dashboard
  /inbox - New pricing requests
  /review - Pending LLM responses
  /sent - Completed conversations
```

## Implementation Plan

### Phase 1: Core Setup
- Next.js app structure
- Database setup (Prisma + PostgreSQL)
- Authentication (NextAuth)
- Basic UI layout

### Phase 2: Document Management
- Document upload interface
- Text extraction (Excel → Markdown tables)
- Document storage and management

### Phase 3: Gemini Integration
- API integration
- Context builder
- Response generation

### Phase 4: Email System
- Email ingestion (IMAP)
- Conversation threading
- Email sending (SMTP)

### Phase 5: Review Workflow
- Review queue
- Response editing
- Approval process

## Technical Stack

### Frontend
- Next.js 14 (App Router)
- Shadcn/ui components
- TanStack Query
- Zustand for state

### Backend
- Next.js API routes
- Prisma ORM
- PostgreSQL
- Redis (job queue)

### External Services
- Google Gemini API
- Email services (IMAP/SMTP)
- Document parsing libraries

## Example Gemini Prompt

```
You are a sales representative for [Company Name]. 

PRICING CRITERIA:
[Document content here]

PRICING CALCULATIONS:
[Document content here]

CURRENT CONVERSATION:
[Email thread]

Please generate a professional pricing quote response based on the client's request. If you need additional information, list the clarifying questions clearly.
```

## Advantages of This Approach

1. **Simplicity**: No complex RAG infrastructure
2. **Accuracy**: All context available to LLM
3. **Flexibility**: Easy to update documents
4. **Cost-Effective**: Single API call per request
5. **Maintainable**: Straightforward architecture