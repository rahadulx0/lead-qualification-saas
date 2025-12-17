-- Migration: 001_initial_schema.sql
-- Purpose: Create initial database schema for lead qualification platform
-- Date: 2025-12-17

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users
-- Purpose: Sales reps and managers
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Info
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),

  -- Role & Permissions
  role VARCHAR(50) NOT NULL DEFAULT 'rep' CHECK (role IN ('rep', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,

  -- Assignment Settings
  max_active_leads INTEGER DEFAULT 20,
  current_lead_count INTEGER DEFAULT 0,

  -- Performance Tracking
  total_leads_assigned INTEGER DEFAULT 0,
  total_leads_contacted INTEGER DEFAULT 0,
  total_leads_qualified INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,

  -- Notification Preferences
  slack_user_id VARCHAR(100),
  notify_email BOOLEAN DEFAULT TRUE,
  notify_slack BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Indexes for users table
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TABLE: leads
-- Purpose: Store all inbound lead submissions
-- ============================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Form Submission Data
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_size VARCHAR(50) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  industry VARCHAR(100),
  inquiry_type VARCHAR(100),
  budget_timeline VARCHAR(50),
  current_solution TEXT,
  message TEXT,

  -- Scoring Fields
  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  category VARCHAR(20) NOT NULL DEFAULT 'Cold' CHECK (category IN ('Hot', 'Warm', 'Cold')),
  score_breakdown JSONB,
  raw_score INTEGER,

  -- Lead Management
  status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Disqualified', 'Opportunity')),
  assigned_to UUID REFERENCES users(id),
  priority_flag BOOLEAN DEFAULT FALSE,

  -- Enrichment Data
  linkedin_url VARCHAR(500),
  company_website VARCHAR(500),
  company_revenue VARCHAR(50),
  enrichment_status VARCHAR(50) DEFAULT 'Pending',

  -- Engagement Tracking
  email_reply_count INTEGER DEFAULT 0,
  pricing_page_visits INTEGER DEFAULT 0,
  demo_video_watched BOOLEAN DEFAULT FALSE,
  last_activity_date TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source VARCHAR(100) DEFAULT 'Webflow Form',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,

  -- Flags
  is_spam BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE,
  qualification_bonus_applied BOOLEAN DEFAULT FALSE
);

-- Indexes for leads table (Performance Critical)
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_category ON leads(category);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_is_deleted ON leads(is_deleted);

-- Composite index for main dashboard query
CREATE INDEX idx_leads_dashboard ON leads(category, status, is_deleted, created_at DESC)
  WHERE is_deleted = FALSE;

-- Composite index for rep-specific queries
CREATE INDEX idx_leads_rep_view ON leads(assigned_to, status, lead_score DESC)
  WHERE is_deleted = FALSE;

-- Unique constraint (prevent duplicate submissions within 24 hours)
CREATE UNIQUE INDEX idx_unique_email_daily ON leads(email, DATE(created_at))
  WHERE is_deleted = FALSE;

-- ============================================
-- TABLE: activities
-- Purpose: Audit trail for all lead actions
-- ============================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Activity Details
  action_type VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Indexes for activities table
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_action_type ON activities(action_type);

-- ============================================
-- TABLE: notifications
-- Purpose: Queue for outbound notifications
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),

  -- Notification Details
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('email', 'slack', 'sms')),
  template_name VARCHAR(100),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT,

  -- Delivery Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for notifications table
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_lead_id ON notifications(lead_id);

-- ============================================
-- TABLE: analytics_snapshots
-- Purpose: Pre-calculated daily metrics
-- ============================================

CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time Period
  snapshot_date DATE NOT NULL UNIQUE,

  -- Lead Volume Metrics
  total_leads INTEGER,
  hot_leads INTEGER,
  warm_leads INTEGER,
  cold_leads INTEGER,

  -- Conversion Metrics
  leads_contacted INTEGER,
  leads_qualified INTEGER,
  leads_disqualified INTEGER,
  leads_to_opportunity INTEGER,

  -- Scoring Metrics
  avg_lead_score NUMERIC(5,2),
  median_lead_score INTEGER,

  -- Performance Metrics
  avg_response_time_minutes INTEGER,
  fastest_response_time_minutes INTEGER,
  slowest_response_time_minutes INTEGER,

  -- Source Breakdown (JSON)
  leads_by_source JSONB,
  avg_score_by_source JSONB,

  -- Created
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for analytics snapshots
CREATE INDEX idx_snapshots_date ON analytics_snapshots(snapshot_date DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp on leads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update last_activity_date on leads when status changes
CREATE OR REPLACE FUNCTION update_last_activity_date()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.last_activity_date = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_activity_date
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity_date();

-- ============================================
-- SEED DATA (Test Users)
-- ============================================

INSERT INTO users (full_name, email, role, slack_user_id) VALUES
  ('Marcus Johnson', 'marcus@company.com', 'rep', 'U12345ABC'),
  ('Sarah Chen', 'sarah@company.com', 'manager', 'U12345DEF'),
  ('Alex Rodriguez', 'alex@company.com', 'rep', 'U12345GHI');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all users (for assignment dropdown)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Reps can view leads assigned to them + unassigned leads
CREATE POLICY "Reps can view their leads"
  ON leads FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR assigned_to IS NULL
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

-- Policy: Managers can view all leads
CREATE POLICY "Managers can view all leads"
  ON leads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin'))
  );

-- Policy: Reps can update leads assigned to them
CREATE POLICY "Reps can update their leads"
  ON leads FOR UPDATE
  USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('manager', 'admin')));

-- Policy: Anyone can view activities (audit trail)
CREATE POLICY "Users can view activities"
  ON activities FOR SELECT
  USING (true);

-- Policy: System can insert activities (via Edge Functions)
CREATE POLICY "System can insert activities"
  ON activities FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VIEWS (For Easy Querying)
-- ============================================

-- View: Hot leads that need immediate attention
CREATE VIEW hot_leads_queue AS
SELECT
  l.id,
  l.company_name,
  l.contact_name,
  l.email,
  l.phone,
  l.lead_score,
  l.category,
  l.status,
  l.assigned_to,
  u.full_name AS assigned_to_name,
  l.created_at,
  EXTRACT(EPOCH FROM (NOW() - l.created_at))/60 AS age_minutes
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id
WHERE l.category = 'Hot'
  AND l.status = 'New'
  AND l.is_deleted = FALSE
ORDER BY l.lead_score DESC, l.created_at ASC;

-- View: Rep performance leaderboard
CREATE VIEW rep_performance AS
SELECT
  u.id,
  u.full_name,
  u.total_leads_assigned,
  u.total_leads_contacted,
  u.total_leads_qualified,
  CASE
    WHEN u.total_leads_assigned > 0
    THEN ROUND(100.0 * u.total_leads_contacted / u.total_leads_assigned, 1)
    ELSE 0
  END AS contact_rate_pct,
  CASE
    WHEN u.total_leads_contacted > 0
    THEN ROUND(100.0 * u.total_leads_qualified / u.total_leads_contacted, 1)
    ELSE 0
  END AS qualification_rate_pct,
  u.avg_response_time_minutes,
  u.current_lead_count
FROM users u
WHERE u.role = 'rep' AND u.is_active = TRUE
ORDER BY qualification_rate_pct DESC;

-- ============================================
-- FUNCTIONS (Helper Functions)
-- ============================================

-- Function: Get next available rep for round-robin assignment
CREATE OR REPLACE FUNCTION get_next_available_rep()
RETURNS UUID AS $$
DECLARE
  next_rep_id UUID;
BEGIN
  SELECT id INTO next_rep_id
  FROM users
  WHERE role = 'rep'
    AND is_active = TRUE
    AND current_lead_count < max_active_leads
  ORDER BY current_lead_count ASC, RANDOM()
  LIMIT 1;

  RETURN next_rep_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Assign lead to rep
CREATE OR REPLACE FUNCTION assign_lead(lead_id UUID, rep_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update lead
  UPDATE leads SET assigned_to = rep_id WHERE id = lead_id;

  -- Update rep lead count
  UPDATE users SET current_lead_count = current_lead_count + 1 WHERE id = rep_id;

  -- Log activity
  INSERT INTO activities (lead_id, user_id, action_type, description)
  VALUES (lead_id, rep_id, 'assigned', 'Lead assigned to rep');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANTS (Permissions)
-- ============================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON leads TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT ON activities TO authenticated;
GRANT SELECT ON hot_leads_queue TO authenticated;
GRANT SELECT ON rep_performance TO authenticated;

-- Grant service role full access (for Edge Functions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE leads IS 'Stores all inbound lead submissions with scoring and management data';
COMMENT ON TABLE users IS 'Sales reps and managers with performance tracking';
COMMENT ON TABLE activities IS 'Audit trail for all lead actions';
COMMENT ON TABLE notifications IS 'Queue for outbound email/Slack notifications';
COMMENT ON COLUMN leads.lead_score IS 'Calculated score 0-100 based on form data';
COMMENT ON COLUMN leads.category IS 'Hot (80-100), Warm (50-79), Cold (0-49)';
COMMENT ON COLUMN leads.score_breakdown IS 'JSON showing point values per field';
COMMENT ON INDEX idx_leads_dashboard IS 'Optimized for main dashboard query with filters';
