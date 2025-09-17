-- Add sample data for the new AI Knowledge Insights dashboard
INSERT INTO ai_knowledge_insights_complex (insight, insights, user_id, created_at) VALUES
-- Revenue Growth & Retention insights
('Revenue Growth & Retention', 'Renewals Secured: 78% of contracts renewed. High-value contracts renewed but 2 major accounts pending.', 'revenue@example.com', '2024-09-18 06:26:00'),
('Revenue Growth & Retention', 'Upsell Opportunities: ₹35L identified. Cross-sell opportunities in tech add-ons for Acme Corp.', 'revenue@example.com', '2024-09-16 06:55:00'),
('Revenue Growth & Retention', 'Churn Risk Accounts: 3 flagged (₹42L pipeline). Zenith Ltd and Nova Tech require immediate action to avoid losses.', 'revenue@example.com', '2024-09-15 22:00:00'),

-- AI Successor Playbook insights
('AI Successor Playbook', 'Meet CFO of Zenith Ltd: 22% revenue exposure, contract expiring in 30 days', 'playbook@example.com', '2024-09-18 06:26:00'),
('AI Successor Playbook', 'Re-negotiate SLA with Nova Tech: 40% churn risk if unresolved', 'playbook@example.com', '2024-09-16 06:55:00'),
('AI Successor Playbook', 'Intro calls with 2 strategic accounts: Strengthens 70% of pipeline', 'playbook@example.com', '2024-09-15 22:00:00'),

-- Critical & Priority AI Insights
('Critical & Priority AI Insights', 'Acme Corp Renewal Risk: AI predicts 68% churn probability. Escalation required within 2 weeks.', 'critical@example.com', '2024-09-18 06:26:00'),
('Critical & Priority AI Insights', 'Zenith Ltd Contract Expiry: Contract ending in 30 days. Direct successor introduction recommended.', 'critical@example.com', '2024-09-16 06:55:00'),
('Critical & Priority AI Insights', 'Delayed Payments - Nova Tech: Late payments for last 2 months. High likelihood of dissatisfaction.', 'critical@example.com', '2024-09-15 22:00:00');