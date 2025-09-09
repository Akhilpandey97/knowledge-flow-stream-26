-- Insert initial test users
INSERT INTO public.users (id, email, role) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'john.doe@company.com', 'exiting'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sarah.wilson@company.com', 'successor'),
  ('550e8400-e29b-41d4-a716-446655440003', 'hr@company.com', 'hr-manager');

-- Insert test handover
INSERT INTO public.handovers (id, employee_id, successor_id, progress) VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 68);

-- Insert test tasks
INSERT INTO public.tasks (id, handover_id, title, description, status) VALUES 
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Client Account Handover - TechCorp', 'Transfer all TechCorp account details, meeting notes, and contact information', 'completed'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'CRM Workflow Documentation', 'Document the custom CRM workflows and automation rules', 'completed'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Renewal Risk Assessment', 'Identify accounts at risk for renewal and provide mitigation strategies', 'pending'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'Team Introduction Sessions', 'Introduce successor to key team members and stakeholders', 'pending');

-- Insert test messages
INSERT INTO public.messages (id, handover_id, sender_id, content) VALUES 
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Hi Sarah, I''ve started documenting the handover process. Let me know if you have any questions!'),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Thanks John! Looking forward to working together on this transition.');