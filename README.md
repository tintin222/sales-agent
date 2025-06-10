# Sales Agent - AI-Powered Pricing Quote System

An automated sales pricing quote system that leverages Google Gemini's large context window to generate accurate pricing responses based on your company's pricing documents.

## Features

- **Document-Based Pricing**: Upload Excel, PDF, Word, or text documents containing your pricing information
- **Large Context Processing**: Utilizes Gemini's 2M token context window to process all pricing documents at once
- **Human-in-the-Loop**: All AI-generated responses require human review before sending
- **Simple Architecture**: Direct database access without complex RAG systems
- **Multi-Format Support**: Parse Excel tables, PDFs, Word documents, and plain text

## Quick Start

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/sales_agent
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Initialize the database:
```bash
npm run db:init
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Setup Guide

### 1. Database Setup

Create a PostgreSQL database and update the `DATABASE_URL` in `.env.local`.

### 2. Gemini API Key

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey) and add it to `.env.local`.

### 3. Initial Configuration

1. Go to Admin Panel (`/admin/documents`)
2. Upload your pricing documents:
   - **Pricing Criteria**: Rules for when different prices apply
   - **Pricing Calculations**: How to calculate prices (formulas, tables)
   - **General Information**: Additional context (terms, conditions)

3. Configure system prompts (`/admin/prompts`)
4. Start processing pricing requests from the Dashboard

## How It Works

1. **Upload Documents**: Admin uploads all pricing-related documents
2. **Email Request**: Client sends pricing request via email or web form
3. **AI Processing**: System sends all documents + request to Gemini in one context
4. **Response Generation**: Gemini generates complete pricing response
5. **Human Review**: Sales rep reviews and approves/edits response
6. **Send Response**: Approved response sent to client

## Project Structure

```
/app
  /admin          - Admin panel for document/prompt management
  /dashboard      - Sales rep interface for processing requests
  /api           - API endpoints
/lib
  /db            - Database queries and schema
  /services      - Document parsing and Gemini integration
/types          - TypeScript type definitions
```

## API Endpoints

- `POST /api/process-email` - Process pricing request
- `GET/POST /api/documents` - Manage pricing documents
- `GET/POST /api/prompts` - Manage system prompts
- `POST /api/documents/upload` - Upload and parse documents

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT