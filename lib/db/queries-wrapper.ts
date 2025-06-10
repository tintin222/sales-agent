// Re-export all functions from queries-supabase
export * from './queries-supabase';

// Override COMPANY_ID for all queries
export function getActiveCompanyId() {
  return 1; // Always use company ID 1
}