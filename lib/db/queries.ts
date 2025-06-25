import pool from './client';

// Company queries
export async function createCompany(name: string) {
  const result = await pool.query(
    'INSERT INTO companies (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
}

export async function getCompany(id: number) {
  const result = await pool.query(
    'SELECT * FROM companies WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// Pricing document queries
export async function createPricingDocument(
  companyId: number,
  documentType: 'criteria' | 'calculation' | 'general',
  name: string,
  contentText: string
) {
  const result = await pool.query(
    'INSERT INTO pricing_documents (company_id, document_type, name, content_text) VALUES ($1, $2, $3, $4) RETURNING *',
    [companyId, documentType, name, contentText]
  );
  return result.rows[0];
}

export async function getActivePricingDocuments(companyId: number) {
  const result = await pool.query(
    'SELECT * FROM pricing_documents WHERE company_id = $1 AND is_active = true ORDER BY document_type, name',
    [companyId]
  );
  return result.rows;
}

export async function updatePricingDocument(
  id: number,
  updates: { name?: string; content_text?: string; is_active?: boolean }
) {
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.content_text !== undefined) {
    fields.push(`content_text = $${paramCount++}`);
    values.push(updates.content_text);
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${paramCount++}`);
    values.push(updates.is_active);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await pool.query(
    `UPDATE pricing_documents SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

// System prompt queries
export async function createSystemPrompt(
  companyId: number,
  promptType: 'main' | 'clarification',
  content: string
) {
  const result = await pool.query(
    'INSERT INTO system_prompts (company_id, prompt_type, content) VALUES ($1, $2, $3) RETURNING *',
    [companyId, promptType, content]
  );
  return result.rows[0];
}

export async function getActiveSystemPrompt(
  companyId: number,
  promptType: 'main' | 'clarification'
) {
  const result = await pool.query(
    'SELECT * FROM system_prompts WHERE company_id = $1 AND prompt_type = $2 AND is_active = true ORDER BY created_at DESC LIMIT 1',
    [companyId, promptType]
  );
  return result.rows[0];
}

// Conversation queries
export async function createConversation(
  companyId: number,
  clientEmail: string,
  subject: string
) {
  const result = await pool.query(
    'INSERT INTO conversations (company_id, client_email, subject) VALUES ($1, $2, $3) RETURNING *',
    [companyId, clientEmail, subject]
  );
  return result.rows[0];
}

export async function getConversations(
  companyId: number,
  status?: string,
  limit = 50
) {
  let query = 'SELECT * FROM conversations WHERE company_id = $1';
  const params: (string | number)[] = [companyId];
  
  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);
  
  const result = await pool.query(query, params);
  return result.rows;
}

export async function updateConversationStatus(
  id: number,
  status: 'pending_review' | 'approved' | 'sent' | 'awaiting_info'
) {
  const result = await pool.query(
    'UPDATE conversations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
}

// Message queries
export async function createMessage(
  conversationId: number,
  direction: 'inbound' | 'outbound',
  content: string,
  geminiResponse?: string
) {
  const result = await pool.query(
    'INSERT INTO messages (conversation_id, direction, content, gemini_response) VALUES ($1, $2, $3, $4) RETURNING *',
    [conversationId, direction, content, geminiResponse]
  );
  return result.rows[0];
}

export async function getConversationMessages(conversationId: number) {
  const result = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  return result.rows;
}

export async function approveMessage(
  messageId: number,
  userId: number,
  finalResponse: string
) {
  const result = await pool.query(
    'UPDATE messages SET final_response = $1, approved_by_user_id = $2, sent_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [finalResponse, userId, messageId]
  );
  return result.rows[0];
}

// User queries
export async function createUser(
  companyId: number,
  email: string,
  name: string,
  role = 'sales_rep'
) {
  const result = await pool.query(
    'INSERT INTO users (company_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [companyId, email, name, role]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}