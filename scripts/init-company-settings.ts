#!/usr/bin/env tsx

import { supabaseAdmin } from '../lib/db/supabase';

const COMPANY_ID = 1;

async function initCompanySettings() {
  console.log('Initializing company settings...');
  
  try {
    // First check if company exists
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', COMPANY_ID)
      .single();
    
    if (companyError || !company) {
      console.error('Company not found. Make sure to run db:seed first.');
      return;
    }
    
    console.log('Found company:', company.name);
    
    // Check if settings exist
    const { data: existingSettings } = await supabaseAdmin
      .from('company_settings')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .single();
    
    if (existingSettings) {
      console.log('Settings already exist:', existingSettings);
    } else {
      // Create initial settings
      const { data: newSettings, error: insertError } = await supabaseAdmin
        .from('company_settings')
        .insert({
          company_id: COMPANY_ID,
          default_model: 'gemini-1.5-pro',
          temperature: 0.7,
          max_tokens: 4096,
          automation_enabled: false,
          automation_model: 'gemini-1.5-flash',
          automation_check_interval: 5,
          automation_domains: []
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating settings:', insertError);
      } else {
        console.log('Created new settings:', newSettings);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

initCompanySettings();