-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Add new check constraint with the correct roles
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['exiting'::text, 'successor'::text, 'hr-manager'::text]));

-- Now update existing users with correct roles
UPDATE users SET role = 'exiting' WHERE email = 'john.doe@company.com';
UPDATE users SET role = 'hr-manager' WHERE email = 'hr@company.com';
UPDATE users SET role = 'successor' WHERE email = 'arbaaz.jawed@gmail.com';

-- Insert ap79020@gmail.com as HR manager
INSERT INTO users (id, email, role, created_at) VALUES 
('ap79020-0000-0000-0000-000000000001', 'ap79020@gmail.com', 'hr-manager', now())
ON CONFLICT (email) DO UPDATE SET role = 'hr-manager';

-- Add more comprehensive sample data
-- Create additional handovers for different departments  
INSERT INTO handovers (id, employee_id, successor_id, progress, created_at) VALUES 
('handover-tech-001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 68, now()),
('handover-sales-001', 'ap79020-0000-0000-0000-000000000001', '27b6fd65-d536-4cd9-b729-e7e5859e5289', 35, now())
ON CONFLICT (id) DO NOTHING;

-- Add more tasks for different scenarios
INSERT INTO tasks (id, handover_id, title, description, status, created_at) VALUES 
-- Engineering tasks
('task-eng-001', 'handover-tech-001', 'Code Repository Access', 'Transfer access to all Git repositories and document deployment procedures', 'done', now()),
('task-eng-002', 'handover-tech-001', 'API Documentation', 'Complete documentation of internal APIs and integration points', 'done', now()),
('task-eng-003', 'handover-tech-001', 'Production Environment Access', 'Set up production server access and monitoring tools', 'pending', now()),
('task-eng-004', 'handover-tech-001', 'Client Meeting Handoffs', 'Introduce successor to key client stakeholders', 'critical', now()),

-- Sales tasks  
('task-sales-001', 'handover-sales-001', 'Sales Pipeline Review', 'Review all active opportunities and deal stages', 'done', now()),
('task-sales-002', 'handover-sales-001', 'Customer Relationship Transfer', 'Introduce successor to key customers and decision makers', 'pending', now()),
('task-sales-003', 'handover-sales-001', 'CRM System Training', 'Train on Salesforce workflows and reporting procedures', 'pending', now()),
('task-sales-004', 'handover-sales-001', 'Territory Planning', 'Review territory strategy and account prioritization', 'critical', now())
ON CONFLICT (id) DO NOTHING;

-- Add sample notes
INSERT INTO notes (id, task_id, content, created_by, created_at) VALUES 
('note-001', '770e8400-e29b-41d4-a716-446655440001', 'Successfully completed client handover meeting. TechCorp team is comfortable with the transition. Next steps documented in shared folder.', '550e8400-e29b-41d4-a716-446655440001', now()),
('note-002', '770e8400-e29b-41d4-a716-446655440002', 'CRM workflows documented in wiki. Screenshots added for complex automation rules. Sarah has admin access now.', '550e8400-e29b-41d4-a716-446655440001', now()),
('note-003', 'task-eng-001', 'All repository access granted. Deployment scripts located in /scripts folder. Production deployment requires approval from tech lead.', '550e8400-e29b-41d4-a716-446655440001', now()),
('note-004', 'task-sales-001', 'Pipeline review completed. $2.3M in active deals. Quarterly targets on track. Key contacts documented in CRM.', 'ap79020-0000-0000-0000-000000000001', now())
ON CONFLICT (id) DO NOTHING;

-- Add sample messages between users
INSERT INTO messages (id, handover_id, sender_id, content, created_at) VALUES 
('msg-001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Hi Sarah! I''ve completed the TechCorp account handover. All documentation is in the shared folder. Let me know if you have any questions!', now() - interval '2 days'),
('msg-002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Thanks John! I reviewed everything. Can we schedule a call to discuss the renewal risk assessment? I want to make sure I understand the mitigation strategies.', now() - interval '1 day'),
('msg-003', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Absolutely! How about tomorrow at 2 PM? I can walk you through each at-risk account and the specific action items.', now() - interval '1 day'),
('msg-004', 'handover-sales-001', 'ap79020-0000-0000-0000-000000000001', 'Arbaaz, I''ve started the sales territory handover. Please review the pipeline analysis I shared. We should meet this week to discuss the key accounts.', now() - interval '3 days'),
('msg-005', 'handover-sales-001', '27b6fd65-d536-4cd9-b729-e7e5859e5289', 'Thanks! I''ve reviewed the pipeline. The enterprise deals look promising. Can you introduce me to the GlobalTech contact this week?', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;