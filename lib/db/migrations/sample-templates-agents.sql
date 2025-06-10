-- First, run the schema migration from add-templates-and-agents.sql if you haven't already

-- Get the first company ID (adjust this if you need a specific company)
-- Replace 1 with your actual company_id in all INSERT statements below

-- Sample Email Templates
INSERT INTO email_templates (company_id, name, subject, content, variables, is_active) VALUES
(1, 'Professional Quote', 'Pricing Information for {product_name}', 'Dear {client_name},

Thank you for your interest in {product_name}. Based on your requirements, I''m pleased to provide you with the following pricing information:

{pricing_details}

This quote is valid for 30 days from today''s date. Please note that:
- Prices are subject to final confirmation based on specific configurations
- Volume discounts may apply for larger orders
- Additional services are available upon request

I''d be happy to schedule a call to discuss this quote in detail and answer any questions you may have.

Best regards,
{agent_name}', ARRAY['client_name', 'product_name', 'pricing_details', 'agent_name'], true),

(1, 'Follow-up Template', 'Following up on our pricing discussion', 'Hi {client_name},

I wanted to follow up on the pricing information I sent over for {product_name}. 

Have you had a chance to review the quote? I''d be happy to address any questions or concerns you might have.

If you need any adjustments to the proposal or would like to explore different options, please let me know.

Looking forward to hearing from you.

Best regards,
{agent_name}', ARRAY['client_name', 'product_name', 'agent_name'], true),

(1, 'Initial Response', 'Re: {subject}', 'Hi {client_name},

Thank you for your inquiry about {product_name}. I''d be happy to help you with pricing information.

To provide you with the most accurate quote, could you please share:
- The specific features or package you''re interested in
- Your expected usage or team size
- Any specific requirements or customizations needed

Once I have these details, I''ll prepare a comprehensive pricing proposal for you.

Best regards,
{agent_name}', ARRAY['client_name', 'product_name', 'subject', 'agent_name'], true);

-- Sample Virtual Agents
INSERT INTO virtual_agents (company_id, name, profile_photo_url, knowledge_base, writing_style, sample_responses, is_active) VALUES
(1, 'Sarah Johnson', NULL, 'Enterprise software solutions, SaaS pricing models, B2B sales strategies, cloud infrastructure costs, implementation timelines, support packages', 'Professional yet friendly, consultative approach, uses data-driven insights, focuses on value proposition, addresses pain points directly', ARRAY['Thank you for reaching out about our enterprise solution. Based on your team size and requirements, I recommend our Professional tier which includes...', 'I understand that implementation timeline is crucial for your team. Typically, our onboarding process takes 2-3 weeks, including...'], true),

(1, 'Michael Chen', NULL, 'Technical product specifications, API integrations, security compliance, performance metrics, scalability options, custom development', 'Technical but accessible, detail-oriented, provides specific examples, addresses technical concerns proactively, includes relevant metrics', ARRAY['Great question about our API rate limits. Our standard tier supports up to 1000 requests per minute, with burst capacity of...', 'Regarding security compliance, we maintain SOC 2 Type II certification and support GDPR requirements through...'], true),

(1, 'Emily Rodriguez', NULL, 'Small to medium business solutions, startup packages, growth scaling options, budget-friendly alternatives, ROI calculations, payment plans', 'Empathetic and understanding, focuses on business growth, provides cost-effective solutions, explains value clearly, offers flexible options', ARRAY['I completely understand budget constraints for growing businesses. Let me show you our Starter package which provides excellent value...', 'Many of our successful clients started with our basic tier and scaled up as they grew. Here''s how that typically works...'], true);