# Automation Workflows - Complete Specification

## Overview

This document defines all automated workflows in the lead qualification system. Each workflow has:
- **Trigger:** Event that starts the workflow
- **Conditions:** Logic to determine if workflow should run
- **Actions:** Steps executed automatically
- **Fallback:** Error handling and retry logic

---

## Workflow 1: Hot Lead Instant Alert

**Business Purpose:** Enable 5-minute response time for high-intent leads

### Trigger
- New lead created in database
- Lead category = "Hot" (score ≥ 80)

### Conditions
```sql
WHERE
  leads.category = 'Hot'
  AND leads.status = 'New'
  AND leads.is_spam = FALSE
```

### Actions

**1. Send Slack Alert to #sales-hot-leads Channel**
```
Trigger: Immediately after lead insertion
Service: Slack Incoming Webhook
Message Format:
  🔥 HOT LEAD ALERT 🔥

  Company: [company_name]
  Contact: [contact_name]
  Email: [email]
  Phone: [phone]
  Score: [lead_score]/100

  Company Size: [company_size]
  Industry: [industry]
  Inquiry: [inquiry_type]
  Timeline: [budget_timeline]

  → View in Dashboard: [dashboard_url]/leads/[lead_id]

  ⏰ Response Target: Contact within 1 hour
```

**2. Send Email Alert to On-Call Sales Rep**
```
Trigger: Same as Slack (parallel execution)
Service: SendGrid
To: sales@company.com (or assigned rep email)
Subject: 🔥 HOT LEAD: [company_name] - Score [lead_score]
Template: hot_lead_alert.html (see send-notification function)
```

**3. Send Auto-Response to Customer**
```
Trigger: Same as above
Service: SendGrid
To: [lead.email]
Subject: Thank you for your interest
Body:
  "Hi [contact_name],

  Thank you for reaching out to us from [company_name]!

  Based on your request, a team member will contact you within 1 hour.

  In the meantime, feel free to:
  - Watch our 2-minute product overview
  - Read customer success stories
  - Explore pricing options

  Questions? Reply to this email.

  Best regards,
  The Sales Team"
```

**4. Auto-Assign to Available Rep**
```
Trigger: After notifications sent
Logic:
  1. Query: SELECT id FROM users
           WHERE role = 'rep'
           AND is_active = TRUE
           AND current_lead_count < max_active_leads
           ORDER BY current_lead_count ASC, RANDOM()
           LIMIT 1

  2. Update: leads SET assigned_to = [rep_id]

  3. Update: users SET current_lead_count = current_lead_count + 1
             WHERE id = [rep_id]

  4. Log: INSERT INTO activities (lead_id, action_type, description)
          VALUES (lead_id, 'assigned', 'Auto-assigned to rep')
```

**5. Create Follow-Up Reminder**
```
Trigger: 1 hour after lead creation
Condition: IF status still = 'New'
Action: Send Slack reminder to assigned rep:
  "⏰ REMINDER: Hot lead [company_name] is still uncontacted (1 hour old)"
```

### Fallback Logic

**If Slack Webhook Fails:**
- Log error to notifications table
- Retry after 1 minute (max 3 retries)
- If still fails, send email alert to admin

**If Email Fails:**
- Log error to notifications table
- Queue for retry (every 5 minutes, max 5 retries)
- After 5 failures, mark notification as 'failed' and alert admin

**If No Rep Available:**
- Assign to sales manager (fallback)
- Send Slack alert to #sales-manager channel
- Flag lead as 'needs_review'

### Expected Outcomes

- **Success Rate Target:** 99.5% notification delivery
- **Average Notification Latency:** <3 seconds from lead creation
- **Rep Response Rate:** 95% within 1 hour

---

## Workflow 2: Warm Lead Assignment & Nurture

**Business Purpose:** Ensure warm leads are contacted within 24 hours

### Trigger
- New lead created with category = "Warm" (score 50-79)

### Actions

**1. Auto-Assign to Rep (Same Logic as Hot Leads)**
```
- Use round-robin assignment
- Prefer rep with lowest current_lead_count
- Update rep's current_lead_count
```

**2. Add to Sales Queue (No Immediate Alert)**
```
- Lead appears in dashboard with "Warm" badge
- Rep sees it next time they log in
- No Slack/email interrupt (not urgent)
```

**3. Send Auto-Response to Customer**
```
Service: SendGrid
To: [lead.email]
Subject: Thank you for your interest
Body:
  "Hi [contact_name],

  Thank you for contacting us!

  A team member will review your request and reach out within 24 hours.

  In the meantime, check out:
  - Our product demo video
  - Customer case studies

  Best regards,
  The Sales Team"
```

**4. Schedule 24-Hour Follow-Up Check**
```
Trigger: 24 hours after lead creation
Condition: IF status still = 'New'
Action:
  1. Send Slack reminder to assigned rep:
     "⏰ Warm lead [company_name] is uncontacted (24 hours old)"
  2. Escalate to manager if no action after 48 hours
```

### Expected Outcomes

- **Contact Rate Target:** 90% within 24 hours
- **Assignment Time:** <5 seconds
- **Auto-Response Delivery:** 100%

---

## Workflow 3: Cold Lead Nurture Track

**Business Purpose:** Don't waste sales time, but keep leads engaged

### Trigger
- New lead created with category = "Cold" (score 0-49)

### Actions

**1. NO Sales Assignment**
```
- Cold leads are NOT assigned to reps
- They go to marketing nurture list
- Status remains 'New'
```

**2. Send Educational Auto-Response**
```
Service: SendGrid
To: [lead.email]
Subject: Resources to help you get started
Body:
  "Hi [contact_name],

  Thank you for your interest in [Product Name]!

  We've sent you some helpful resources to get started:

  📄 Ultimate Guide to [Topic]
  ▶ Product Overview Video
  💡 Best Practices from Top Customers

  When you're ready to talk, just reply to this email.

  Best,
  The Team"
```

**3. Add to Marketing Email List**
```
Service: Email marketing platform (Mailchimp, SendGrid Marketing)
Action:
  1. Add contact to "Cold Leads - Nurture" segment
  2. Enroll in drip campaign:
     - Day 0: Welcome email + resources
     - Day 3: Case study
     - Day 7: Product deep-dive
     - Day 14: Customer testimonial
     - Day 30: "Ready to talk?" email
```

**4. Re-Score on Engagement**
```
Trigger: Lead engages with email (opens, clicks)
Action:
  1. Track engagement in leads.pricing_page_visits or email_reply_count
  2. Recalculate score (add engagement bonus points)
  3. IF new score ≥ 50, upgrade to Warm → trigger Workflow 2
```

### Expected Outcomes

- **Email Open Rate:** 25%+
- **Upgrade Rate:** 5-10% of cold leads become warm within 30 days
- **Sales Time Saved:** 100% (no rep involvement unless lead heats up)

---

## Workflow 4: Lead Status Change Automation

**Business Purpose:** Keep data fresh, surface actionable insights

### Trigger: Lead Status Updated

#### 4A: Status Changed to "Contacted"

**Actions:**
1. Update `last_activity_date` timestamp (automatic via trigger)
2. Calculate response time:
   ```sql
   response_time_minutes = (contacted_at - created_at) in minutes
   ```
3. Update rep's `avg_response_time_minutes`:
   ```sql
   UPDATE users
   SET avg_response_time_minutes = (
     SELECT AVG(EXTRACT(EPOCH FROM (l.last_activity_date - l.created_at))/60)
     FROM leads l
     WHERE l.assigned_to = users.id AND l.status = 'Contacted'
   )
   WHERE id = [rep_id]
   ```
4. Log activity:
   ```sql
   INSERT INTO activities (lead_id, user_id, action_type, description)
   VALUES (lead_id, rep_id, 'status_changed', 'Status changed from New to Contacted')
   ```

#### 4B: Status Changed to "Qualified"

**Actions:**
1. Add qualification bonus (+10 points to score)
   ```sql
   UPDATE leads
   SET lead_score = lead_score + 10,
       qualification_bonus_applied = TRUE
   WHERE id = [lead_id] AND qualification_bonus_applied = FALSE
   ```
2. Update rep stats:
   ```sql
   UPDATE users
   SET total_leads_qualified = total_leads_qualified + 1
   WHERE id = [rep_id]
   ```
3. Send Slack notification to sales manager:
   ```
   "✅ [Rep Name] qualified lead: [Company Name] (Score: [score])"
   ```

#### 4C: Status Changed to "Opportunity"

**Actions:**
1. Send notification to CRM integration webhook (future feature)
2. Archive lead from active dashboard (move to "Pipeline" view)
3. Update rep stats:
   ```sql
   UPDATE users
   SET current_lead_count = current_lead_count - 1
   WHERE id = [rep_id]
   ```

#### 4D: Status Changed to "Disqualified"

**Actions:**
1. Update rep stats
2. Free up rep capacity:
   ```sql
   UPDATE users
   SET current_lead_count = current_lead_count - 1
   WHERE id = [rep_id]
   ```
3. Log disqualification reason (if provided)
4. Send to data analysis queue (why were they disqualified?)

---

## Workflow 5: Stale Lead Alert

**Business Purpose:** Prevent leads from falling through cracks

### Trigger
- Scheduled job (runs every 6 hours)
- Checks for leads in "New" status > 24 hours old

### Condition
```sql
SELECT * FROM leads
WHERE status = 'New'
  AND created_at < NOW() - INTERVAL '24 hours'
  AND is_deleted = FALSE
  AND category IN ('Hot', 'Warm')
```

### Actions

**1. Flag Lead as Delayed**
```sql
UPDATE leads
SET needs_review = TRUE
WHERE id IN [stale_lead_ids]
```

**2. Send Slack Alert to Manager**
```
Message:
  ⚠️ STALE LEADS ALERT

  The following leads are >24 hours old and uncontacted:

  1. [Company Name] (Hot, assigned to [Rep]) - 36 hours old
  2. [Company Name] (Warm, assigned to [Rep]) - 28 hours old

  → View stale leads: [dashboard_url]/stale-leads
```

**3. Auto-Reassign if >48 Hours**
```sql
-- If lead is >48 hours old, reassign to different rep
UPDATE leads
SET assigned_to = (SELECT id FROM get_next_available_rep())
WHERE id = [lead_id]
  AND status = 'New'
  AND created_at < NOW() - INTERVAL '48 hours'
```

---

## Workflow 6: Daily Analytics Snapshot

**Business Purpose:** Pre-calculate metrics for fast dashboard loading

### Trigger
- Scheduled job (runs daily at midnight UTC)

### Actions

**1. Calculate Daily Metrics**
```sql
INSERT INTO analytics_snapshots (
  snapshot_date,
  total_leads,
  hot_leads,
  warm_leads,
  cold_leads,
  leads_contacted,
  leads_qualified,
  leads_disqualified,
  leads_to_opportunity,
  avg_lead_score,
  median_lead_score,
  avg_response_time_minutes,
  fastest_response_time_minutes,
  slowest_response_time_minutes,
  leads_by_source,
  avg_score_by_source
)
SELECT
  CURRENT_DATE - INTERVAL '1 day',
  COUNT(*),
  COUNT(*) FILTER (WHERE category = 'Hot'),
  COUNT(*) FILTER (WHERE category = 'Warm'),
  COUNT(*) FILTER (WHERE category = 'Cold'),
  COUNT(*) FILTER (WHERE status = 'Contacted'),
  COUNT(*) FILTER (WHERE status = 'Qualified'),
  COUNT(*) FILTER (WHERE status = 'Disqualified'),
  COUNT(*) FILTER (WHERE status = 'Opportunity'),
  AVG(lead_score),
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lead_score),
  AVG(EXTRACT(EPOCH FROM (last_activity_date - created_at))/60) FILTER (WHERE status = 'Contacted'),
  MIN(EXTRACT(EPOCH FROM (last_activity_date - created_at))/60) FILTER (WHERE status = 'Contacted'),
  MAX(EXTRACT(EPOCH FROM (last_activity_date - created_at))/60) FILTER (WHERE status = 'Contacted'),
  jsonb_object_agg(COALESCE(utm_source, 'direct'), COUNT(*)),
  jsonb_object_agg(COALESCE(utm_source, 'direct'), AVG(lead_score))
FROM leads
WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
  AND created_at < CURRENT_DATE
  AND is_deleted = FALSE
```

**2. Send Daily Report to Manager**
```
Service: Slack
Channel: #sales-metrics
Message:
  📊 DAILY LEAD REPORT - [Date]

  Total Leads: [total]
  - Hot: [hot_count] ([hot_pct]%)
  - Warm: [warm_count] ([warm_pct]%)
  - Cold: [cold_count] ([cold_pct]%)

  Performance:
  - Avg Score: [avg_score]/100
  - Contacted: [contacted]/[total] ([contact_rate]%)
  - Qualified: [qualified]/[contacted] ([qual_rate]%)
  - Avg Response Time: [response_time] minutes

  Top Source: [best_source] (avg score: [source_score])
```

---

## Workflow 7: Lead Enrichment (Background Job)

**Business Purpose:** Add company data to improve qualification

### Trigger
- New lead created
- Enrichment status = 'Pending'
- Runs asynchronously (doesn't block form submission)

### Actions

**1. Extract Company Domain from Email**
```javascript
const emailDomain = email.split('@')[1]
// e.g., "john@acme.com" → "acme.com"
```

**2. Call Company Enrichment API (Optional)**
```
Service: Clearbit, ZoomInfo, or LinkedIn Sales Navigator API
Input: Company domain or name
Output:
  - Company website
  - LinkedIn URL
  - Employee count (verify form data)
  - Revenue range
  - Tech stack
```

**3. Update Lead Record**
```sql
UPDATE leads
SET
  company_website = [enriched_website],
  linkedin_url = [enriched_linkedin],
  company_revenue = [enriched_revenue],
  enrichment_status = 'Enriched'
WHERE id = [lead_id]
```

**4. Re-Calculate Score if Data Changes**
```
If enriched company_size differs from form submission:
  - Recalculate score with correct company size
  - Update category if score crosses threshold
  - Log activity: "Score updated after enrichment"
```

---

## Implementation: Supabase Database Functions

### Cron Jobs Setup (Supabase pg_cron extension)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job 1: Stale lead alert (every 6 hours)
SELECT cron.schedule(
  'stale-lead-alert',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT send_stale_lead_alerts();
  $$
);

-- Job 2: Daily analytics snapshot (midnight UTC)
SELECT cron.schedule(
  'daily-analytics',
  '0 0 * * *',  -- Midnight daily
  $$
  INSERT INTO analytics_snapshots ...
  -- [SQL from Workflow 6]
  $$
);

-- Job 3: Lead enrichment queue processor (every 5 minutes)
SELECT cron.schedule(
  'process-enrichment-queue',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT process_lead_enrichment();
  $$
);
```

---

## Monitoring & Alerts

### Workflow Health Metrics

Track these metrics to ensure workflows are running correctly:

| Metric                         | Target       | Alert Threshold |
|--------------------------------|--------------|-----------------|
| Notification delivery rate     | >99%         | <95%            |
| Average notification latency   | <3 seconds   | >10 seconds     |
| Stale leads (>24hrs, New)      | <5%          | >15%            |
| Auto-assignment success rate   | 100%         | <98%            |
| Daily snapshot job completion  | 100%         | Job failed      |

### Error Handling

**Notification Failures:**
- Log to `notifications` table with status = 'failed'
- Retry automatically (exponential backoff: 1min, 5min, 15min)
- After 3 failures, send alert to engineering Slack channel

**Database Trigger Failures:**
- Log to application monitoring (Sentry, Datadog)
- Send immediate alert to on-call engineer
- Fail gracefully (don't block user-facing operations)

**Cron Job Failures:**
- pg_cron logs failures automatically
- Set up alerts for missed job executions
- Manual backup: Run analytics snapshot via API endpoint if cron fails

---

This automation workflow is **production-ready** and designed for **zero manual intervention** in the happy path.
