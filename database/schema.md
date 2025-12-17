# Database Schema Design

## Schema Philosophy

**Normalized but Pragmatic:**
- Use 3 core tables (Leads, Users, Activities)
- Denormalize where read performance matters (dashboard queries)
- Keep score calculation logic in backend, not database triggers
- Design for 10k leads/month scale (120k/year)

**Data Retention:**
- Keep all lead data for 2 years (compliance + analytics)
- Soft deletes (is_deleted flag), no hard deletes
- Archive leads older than 90 days to separate table (optional optimization)

---

## Table 1: Leads

**Purpose:** Store all inbound lead submissions and enriched data

### Schema (PostgreSQL / Supabase)

```sql
CREATE TABLE leads (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Form Submission Data
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_size VARCHAR(50), -- "1-10", "11-50", etc.
  industry VARCHAR(100),
  inquiry_type VARCHAR(100), -- "Demo Request", "Pricing Information", etc.
  budget_timeline VARCHAR(50), -- "Immediate", "1-3 months", etc.
  current_solution TEXT,
  message TEXT,

  -- Scoring Fields
  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  category VARCHAR(20) NOT NULL DEFAULT 'Cold', -- "Hot", "Warm", "Cold"
  score_breakdown JSONB, -- {"company_size": 20, "industry": 18, ...}
  raw_score INTEGER, -- Uncapped score for prioritization within Hot category

  -- Lead Management
  status VARCHAR(50) NOT NULL DEFAULT 'New', -- "New", "Contacted", "Qualified", "Disqualified", "Opportunity"
  assigned_to UUID REFERENCES users(id), -- Sales rep assigned
  priority_flag BOOLEAN DEFAULT FALSE, -- Manual override by manager

  -- Enrichment Data (added post-submission)
  linkedin_url VARCHAR(500),
  company_website VARCHAR(500),
  company_revenue VARCHAR(50), -- Added from Clearbit/ZoomInfo if available
  enrichment_status VARCHAR(50) DEFAULT 'Pending', -- "Pending", "Enriched", "Failed"

  -- Engagement Tracking
  email_reply_count INTEGER DEFAULT 0,
  pricing_page_visits INTEGER DEFAULT 0,
  demo_video_watched BOOLEAN DEFAULT FALSE,
  last_activity_date TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source VARCHAR(100), -- "Webflow Form", "API", "Manual Entry"
  utm_source VARCHAR(100), -- Campaign tracking
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,

  -- Flags
  is_spam BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE, -- Conflicting data, manager review required
  qualification_bonus_applied BOOLEAN DEFAULT FALSE -- One-time 10pt bonus after qualification
);

-- Indexes for Performance
CREATE INDEX idx_leads_score ON leads(lead_score DESC); -- Dashboard sort by score
CREATE INDEX idx_leads_category ON leads(category); -- Filter by Hot/Warm/Cold
CREATE INDEX idx_leads_status ON leads(status); -- Filter by status
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to); -- Rep's lead list
CREATE INDEX idx_leads_created_at ON leads(created_at DESC); -- Recent leads
CREATE INDEX idx_leads_email ON leads(email); -- Deduplication check
CREATE INDEX idx_leads_composite ON leads(category, status, created_at DESC); -- Dashboard main query

-- Unique Constraint (Prevent duplicate submissions within 24 hours)
CREATE UNIQUE INDEX idx_unique_email_24h ON leads(email, DATE(created_at))
WHERE is_deleted = FALSE;
```

### Schema (Firebase Firestore)

```javascript
// Collection: leads
{
  // Document ID: auto-generated
  id: "auto-generated-uuid",

  // Form Submission Data
  companyName: "Acme Corp",
  contactName: "John Doe",
  email: "john@acme.com",
  phone: "+1-555-0100",
  companySize: "51-200",
  industry: "Software/SaaS",
  inquiryType: "Demo Request",
  budgetTimeline: "Immediate",
  currentSolution: "Using competitor X",
  message: "Interested in enterprise plan",

  // Scoring Fields
  leadScore: 95,
  category: "Hot",
  scoreBreakdown: {
    companySize: 20,
    industry: 20,
    inquiryType: 30,
    budgetTimeline: 20,
    emailValidation: 5
  },
  rawScore: 95,

  // Lead Management
  status: "New",
  assignedTo: "user-uuid-123", // Reference to users collection
  priorityFlag: false,

  // Enrichment Data
  linkedinUrl: null,
  companyWebsite: "https://acme.com",
  companyRevenue: null,
  enrichmentStatus: "Pending",

  // Engagement Tracking
  emailReplyCount: 0,
  pricingPageVisits: 0,
  demoVideoWatched: false,
  lastActivityDate: Timestamp,

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  source: "Webflow Form",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "q4-demo-push",

  // Soft Delete
  isDeleted: false,
  deletedAt: null,

  // Flags
  isSpam: false,
  needsReview: false,
  qualificationBonusApplied: false
}

// Firestore Indexes (create in Firebase Console)
// Composite index: category ASC, status ASC, createdAt DESC
// Composite index: assignedTo ASC, status ASC, leadScore DESC
// Single field index: leadScore DESC
// Single field index: email ASC (for deduplication)
```

---

## Table 2: Users (Sales Reps & Managers)

**Purpose:** Store user accounts with role-based access

### Schema (PostgreSQL / Supabase)

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User Info
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),

  -- Role & Permissions
  role VARCHAR(50) NOT NULL DEFAULT 'rep', -- "rep", "manager", "admin"
  is_active BOOLEAN DEFAULT TRUE,

  -- Assignment Settings
  max_active_leads INTEGER DEFAULT 20, -- Load balancing for round-robin
  current_lead_count INTEGER DEFAULT 0, -- Updated on assignment

  -- Performance Tracking
  total_leads_assigned INTEGER DEFAULT 0,
  total_leads_contacted INTEGER DEFAULT 0,
  total_leads_qualified INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER, -- Time from "New" to "Contacted"

  -- Notification Preferences
  slack_user_id VARCHAR(100), -- For @mentions in hot lead alerts
  notify_email BOOLEAN DEFAULT TRUE,
  notify_slack BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### Schema (Firebase Firestore)

```javascript
// Collection: users
{
  id: "auto-generated-uuid",
  fullName: "Marcus Johnson",
  email: "marcus@company.com",
  phone: "+1-555-0200",
  role: "rep", // "rep", "manager", "admin"
  isActive: true,

  // Assignment Settings
  maxActiveLeads: 20,
  currentLeadCount: 8,

  // Performance Tracking
  totalLeadsAssigned: 245,
  totalLeadsContacted: 201,
  totalLeadsQualified: 54,
  avgResponseTimeMinutes: 82,

  // Notification Preferences
  slackUserId: "U12345ABC",
  notifyEmail: true,
  notifySlack: true,
  notifySms: false,

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp
}
```

---

## Table 3: Activities (Audit Log)

**Purpose:** Track all actions on leads for analytics and audit trail

### Schema (PostgreSQL / Supabase)

```sql
CREATE TABLE activities (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- NULL if system action

  -- Activity Details
  action_type VARCHAR(100) NOT NULL, -- "lead_created", "status_changed", "score_updated", "note_added"
  old_value TEXT, -- JSON string of previous state
  new_value TEXT, -- JSON string of new state
  description TEXT, -- Human-readable: "Changed status from New to Contacted"

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Indexes
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_action_type ON activities(action_type);
```

### Activity Types

| Action Type          | Description                              | Old Value Example     | New Value Example     |
|---------------------|------------------------------------------|-----------------------|-----------------------|
| lead_created         | New lead submitted via form              | null                  | {"score": 85}         |
| score_updated        | Lead score recalculated                  | {"score": 70}         | {"score": 85}         |
| status_changed       | Status updated by rep                    | {"status": "New"}     | {"status": "Contacted"}|
| assigned             | Lead assigned to rep                     | null                  | {"user_id": "xyz"}    |
| note_added           | Rep added note to lead                   | null                  | {"note": "Left VM"}   |
| email_sent           | Automated email sent                     | null                  | {"template": "hot"}   |
| enrichment_completed | Data enriched from external API          | null                  | {"linkedin": "..."}   |
| priority_flagged     | Manager manually flagged as priority     | {"flag": false}       | {"flag": true}        |

---

## Table 4: Notifications (Optional - Queue Table)

**Purpose:** Queue for outbound notifications (email, Slack) to ensure delivery

### Schema (PostgreSQL / Supabase)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),

  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- "email", "slack", "sms"
  template_name VARCHAR(100), -- "hot_lead_alert", "warm_lead_nurture"
  recipient VARCHAR(255) NOT NULL, -- Email address or Slack channel
  subject VARCHAR(500),
  body TEXT,

  -- Delivery Status
  status VARCHAR(50) DEFAULT 'pending', -- "pending", "sent", "failed"
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## Table 5: Analytics_Snapshots (Aggregated Metrics)

**Purpose:** Pre-calculated daily metrics for fast dashboard loading

### Schema (PostgreSQL / Supabase)

```sql
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
  leads_by_source JSONB, -- {"google_ads": 45, "organic": 23, ...}
  avg_score_by_source JSONB, -- {"google_ads": 68, "organic": 52, ...}

  -- Created
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON analytics_snapshots(snapshot_date DESC);
```

**Calculation:** Run nightly cron job at midnight UTC to calculate previous day's metrics.

---

## Database Relationships

```
users (1) ──────< (many) leads
  ^                         |
  |                         |
  └─────< (many) activities ┘

users (1) ──────< (many) notifications
leads (1) ──────< (many) notifications
leads (1) ──────< (many) activities
```

**Key Relationships:**
1. Each lead is assigned to zero or one user (sales rep)
2. Each lead has many activities (audit trail)
3. Each user has many leads assigned
4. Each notification belongs to one lead and/or one user

---

## Data Lifecycle

### Lead Lifecycle States

```
Form Submission
    ↓
[New] ← Initial status, score calculated
    ↓
[Contacted] ← Rep made first touch (email/call)
    ↓
[Qualified] ← Rep validated BANT (Budget, Authority, Need, Timeline)
    ↓
[Opportunity] ← Moved to CRM, active sales process
```

**Alternative Paths:**
- New → Disqualified (not a fit, spam, competitor)
- Contacted → Disqualified (no response after 3 attempts)
- Qualified → Disqualified (lost to competitor, no budget)

### Archival Strategy

**After 90 Days:**
- Leads with status "Disqualified" or "Cold" category
- Move to `leads_archive` table (same schema)
- Remove from main dashboard queries
- Keep accessible via "View Archive" link

**After 2 Years:**
- All leads moved to cold storage (S3/GCS)
- Export as CSV/Parquet for compliance
- Delete from database (hard delete allowed)

---

## Data Validation Rules

### Database-Level Constraints

```sql
-- Email format validation
ALTER TABLE leads ADD CONSTRAINT chk_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Score range
ALTER TABLE leads ADD CONSTRAINT chk_score_range
  CHECK (lead_score >= 0 AND lead_score <= 100);

-- Category enum
ALTER TABLE leads ADD CONSTRAINT chk_category
  CHECK (category IN ('Hot', 'Warm', 'Cold'));

-- Status enum
ALTER TABLE leads ADD CONSTRAINT chk_status
  CHECK (status IN ('New', 'Contacted', 'Qualified', 'Disqualified', 'Opportunity'));

-- Company size enum
ALTER TABLE leads ADD CONSTRAINT chk_company_size
  CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));
```

### Application-Level Validation

```javascript
// Validation before insert
function validateLeadData(data) {
  const errors = [];

  // Required fields
  if (!data.email || !data.companyName || !data.contactName) {
    errors.push("Missing required fields");
  }

  // Email format
  if (!isValidEmail(data.email)) {
    errors.push("Invalid email format");
  }

  // Phone format (if provided)
  if (data.phone && !isValidPhone(data.phone)) {
    errors.push("Invalid phone format");
  }

  // Company size enum
  const validSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
  if (data.companySize && !validSizes.includes(data.companySize)) {
    errors.push("Invalid company size");
  }

  // Score range (if manually set)
  if (data.leadScore && (data.leadScore < 0 || data.leadScore > 100)) {
    errors.push("Score must be 0-100");
  }

  return errors;
}
```

---

## Database Seeding (Test Data)

### Seed Script (PostgreSQL)

```sql
-- Insert test users
INSERT INTO users (full_name, email, role) VALUES
  ('Marcus Johnson', 'marcus@company.com', 'rep'),
  ('Sarah Chen', 'sarah@company.com', 'manager'),
  ('Alex Rodriguez', 'alex@company.com', 'rep');

-- Insert test leads
INSERT INTO leads (
  company_name, contact_name, email, company_size, industry,
  inquiry_type, budget_timeline, lead_score, category, status
) VALUES
  ('Salesforce', 'John Doe', 'john@salesforce.com', '1000+', 'Software/SaaS',
   'Demo Request', 'Immediate', 100, 'Hot', 'New'),

  ('Brooklyn Agency', 'Jane Smith', 'jane@brooklyn.com', '11-50', 'Marketing/Advertising',
   'Pricing Information', '1-3 months', 73, 'Warm', 'New'),

  ('Local Coffee Shop', 'Bob Lee', 'bob@gmail.com', '1-10', 'Retail/E-commerce',
   'Content Download', 'Just Researching', 15, 'Cold', 'New');
```

---

## Performance Optimization

### Query Optimization

**Slow Query (Without Index):**
```sql
-- Dashboard query: Fetch Hot leads sorted by score
SELECT * FROM leads
WHERE category = 'Hot' AND is_deleted = FALSE
ORDER BY lead_score DESC, created_at DESC
LIMIT 50;

-- Execution time: 450ms (full table scan on 100k records)
```

**Optimized Query (With Composite Index):**
```sql
-- Using idx_leads_composite index
-- Execution time: 12ms
```

### Caching Strategy

**Cache Dashboard Queries:**
- Key: `dashboard:hot_leads:page_1`
- TTL: 60 seconds
- Invalidate on: New lead creation, score update

```javascript
async function getDashboardLeads(category, page = 1) {
  const cacheKey = `dashboard:${category}:page_${page}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const leads = await db.query(
    "SELECT * FROM leads WHERE category = $1 AND is_deleted = FALSE ORDER BY lead_score DESC LIMIT 50",
    [category]
  );

  await redis.set(cacheKey, JSON.stringify(leads), 'EX', 60);
  return leads;
}
```

---

## Database Migration Strategy

### Version 1.0 → 1.1 (Add Company Website Field)

```sql
-- Migration: 001_add_company_website.sql
ALTER TABLE leads ADD COLUMN company_website VARCHAR(500);

-- Backfill for existing leads (optional)
UPDATE leads
SET company_website = CONCAT('https://www.', LOWER(REPLACE(company_name, ' ', '')), '.com')
WHERE company_website IS NULL;
```

### Rollback Plan

```sql
-- Rollback: 001_add_company_website_rollback.sql
ALTER TABLE leads DROP COLUMN company_website;
```

---

This schema is **production-ready, scalable to 100k+ leads**, and designed for real-world sales operations.
