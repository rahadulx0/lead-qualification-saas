# Future Roadmap - Product Evolution

## Roadmap Philosophy

**Principle:** Ship features when they solve a proven pain point, not because they're technically interesting.

**Prioritization Framework:**
1. **Customer demand:** >30% of users request it
2. **Revenue impact:** Unlocks new customer segment or increases retention
3. **Technical feasibility:** <4 weeks development time
4. **Competitive necessity:** Competitors have it, we're losing deals

---

## Phase 2: Intelligence Layer (Months 4-6)

### 2.1 AI/ML Lead Scoring

**Why Build This:**
- Formula-based scoring captures 80% of patterns, but misses nuanced signals
- After 6 months, we have 3,000 leads with outcomes (qualified/disqualified/closed-won)
- Can train ML model to predict "likelihood to close" more accurately than formula

**What Changes:**
- Keep formula scoring as baseline (transparent, auditable)
- Add ML score as secondary signal: "Formula: 75, AI: 0.82 (High)"
- Sales manager can choose which to prioritize

**Technical Implementation:**
```python
# Train model on historical data
features = [
  'company_size',
  'industry',
  'inquiry_type',
  'budget_timeline',
  'email_domain',
  'time_of_day_submitted',
  'message_length',
  'form_completion_time_seconds'
]

target = 'closed_won' # Binary: 1 if deal closed, 0 if not

model = RandomForestClassifier()
model.fit(X_train, y_train)

# Predict probability (0.0-1.0) for new leads
ai_score = model.predict_proba(new_lead)[0][1] * 100
```

**Success Metric:**
- AI score correlates better with closed-won than formula (r² >0.75)
- ROC-AUC >0.85 (good classifier)

**Effort:** 3 weeks
**Risk:** Overfitting if <1000 training samples

---

### 2.2 Advanced Lead Enrichment

**Why Build This:**
- 30% of leads don't provide company size or industry
- Manually researching on LinkedIn wastes 5 min/lead
- Enrichment APIs (Clearbit, ZoomInfo) auto-fill missing data

**What It Does:**
1. Lead submits with email: `john@acme-corp.com`
2. Extract domain: `acme-corp.com`
3. Call Clearbit API: `GET /v2/companies/find?domain=acme-corp.com`
4. Response:
   ```json
   {
     "name": "Acme Corp",
     "employees": 450,
     "industry": "Software",
     "revenue": "$50M-$100M",
     "linkedin": "linkedin.com/company/acme-corp"
   }
   ```
5. Update lead record, recalculate score with accurate data

**Cost:**
- Clearbit: $99/mo for 2,500 enrichments (bulk pricing)
- ZoomInfo: $250/mo (more expensive, better data)
- Start with Clearbit, upgrade if needed

**Success Metric:**
- 80% of leads auto-enriched
- Score accuracy improves (measured by conversion correlation)

**Effort:** 2 weeks
**Dependency:** Need budget approval for API costs

---

## Phase 3: CRM Integration (Months 7-9)

### 3.1 Salesforce Integration

**Why Build This:**
- Sales teams already use Salesforce for pipeline management
- Currently, reps manually copy lead data from dashboard → Salesforce (5 min/lead)
- "One-click push to CRM" saves 25 hours/week for 10-rep team

**What It Does:**
1. Rep clicks "Create Opportunity" in dashboard
2. System calls Salesforce API:
   ```javascript
   POST /services/data/v56.0/sobjects/Opportunity
   {
     "Name": "Acme Corp - Q1 2025",
     "StageName": "Qualification",
     "CloseDate": "2025-03-31",
     "AccountId": "{{matched_account_id}}",
     "LeadSource": "Website - Demo Request",
     "Amount": null
   }
   ```
3. Opportunity created in Salesforce, link stored in `leads` table
4. Bi-directional sync: Status updates in Salesforce → reflected in dashboard

**Technical Challenges:**
- OAuth 2.0 authentication (30-minute setup per org)
- Account matching (is "Acme Corp" the same as "ACME Corporation"?)
- Field mapping (Salesforce custom fields vary by company)

**Success Metric:**
- 90% of qualified leads pushed to CRM in <30 seconds
- Sales reps report "saves 2 hours/week" in survey

**Effort:** 4 weeks (OAuth + field mapping + testing)

---

### 3.2 HubSpot Integration

**Why Build This:**
- 40% of small B2B companies use HubSpot (Salesforce is enterprise-focused)
- Same value prop: eliminate manual data entry

**Implementation:**
- Similar to Salesforce, but HubSpot API is easier (better docs)
- HubSpot has built-in lead scoring—sync our score to their field

**Effort:** 2 weeks (learned from Salesforce implementation)

---

## Phase 4: Team Collaboration (Months 10-12)

### 4.1 Internal Notes & Comments

**Why Build This:**
- Rep calls lead, leaves voicemail: "Called 2x, no answer, try after 3pm EST"
- Currently tracked in rep's personal notes (lost when they leave)
- Shared notes enable collaboration, handoffs

**What It Does:**
```
Lead Detail Page:
  Company: Acme Corp
  Score: 85
  Status: Contacted

  [Activity Timeline]
  - 2025-01-15 10:32am: Marcus called, left voicemail
  - 2025-01-15 2:15pm: Marcus sent follow-up email
  - 2025-01-16 9:00am: Sarah (manager) flagged as priority
  - 2025-01-16 11:30am: Marcus connected, scheduling demo for Friday

  [Add Note]
  Type: Call, Email, Meeting, Other
  Note: _____________________
  [Save]
```

**Technical Implementation:**
```sql
CREATE TABLE lead_notes (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  note_type VARCHAR(50), -- 'call', 'email', 'meeting', 'internal'
  note_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Success Metric:**
- Reps add 2+ notes per qualified lead (adoption)
- Manager visibility: can audit rep activity

**Effort:** 1 week

---

### 4.2 Lead Assignment Rules

**Why Build This:**
- Currently, hot leads auto-assign via round-robin
- Some reps specialize (Enterprise vs SMB, vertical industries)
- Manager wants custom rules: "Assign all Healthcare leads to Sarah"

**What It Does:**
```
Assignment Rules (Manager Config):
  1. IF industry = "Healthcare" → Assign to Sarah
  2. IF company_size = "1000+" → Assign to Alex (Enterprise AE)
  3. ELSE → Round-robin among remaining reps

Priority: Manual assignment > Custom rules > Round-robin
```

**Technical Implementation:**
```javascript
function assignLead(lead) {
  // Check custom rules first
  const rules = await getAssignmentRules();

  for (const rule of rules) {
    if (matchesCondition(lead, rule.condition)) {
      return rule.assigned_to;
    }
  }

  // Fallback to round-robin
  return getNextAvailableRep();
}
```

**Success Metric:**
- Conversion rate improves when leads routed to specialists

**Effort:** 2 weeks

---

## Phase 5: Revenue Attribution (Months 13-15)

### 5.1 Closed-Won Tracking

**Why Build This:**
- Currently, we track lead → opportunity
- We don't know which leads actually closed (won vs lost)
- Can't measure true ROI: "This campaign generated $X in closed revenue"

**What It Does:**
1. Rep marks opportunity as "Closed-Won" in CRM
2. Webhook or sync pulls closed deals into our system:
   ```sql
   UPDATE leads
   SET final_outcome = 'Closed-Won',
       deal_amount = 50000,
       closed_date = '2025-03-15'
   WHERE id = '{{lead_id}}'
   ```
3. Dashboard shows:
   - "Google Ads generated 15 leads → 3 closed → $150k revenue"
   - "Formula scored them 68 avg, conversion rate 20%"

**Success Metric:**
- Can calculate cost-per-acquisition by campaign source
- Prove platform ROI: "$X in closed revenue / $Y platform cost"

**Effort:** 3 weeks (requires CRM integration first)

---

### 5.2 Campaign ROI Dashboard

**Why Build This:**
- Marketing manager needs to justify budget
- "We spent $10k on LinkedIn ads—was it worth it?"

**What It Shows:**
| Campaign       | Spend  | Leads | Avg Score | SQL | Closed | Revenue | ROI    |
|----------------|--------|-------|-----------|-----|--------|---------|--------|
| Google Ads     | $5,000 | 150   | 68        | 27  | 8      | $240k   | 4700%  |
| LinkedIn Ads   | $8,000 | 45    | 74        | 18  | 5      | $150k   | 1775%  |
| Content (SEO)  | $0     | 200   | 52        | 24  | 6      | $180k   | ∞      |

**Insights:**
- Google Ads has best ROI (high volume + good quality)
- LinkedIn Ads has highest avg score (best targeting)
- Organic SEO is free but lower quality

**Success Metric:**
- Marketing shifts budget to highest ROI channels

**Effort:** 2 weeks (data visualization)

---

## Phase 6: Enterprise Features (Months 16-18)

### 6.1 Multi-Team Support

**Why Build This:**
- Companies with 50+ reps have multiple teams (SMB, Mid-Market, Enterprise)
- Each team needs separate lead queues, dashboards

**What It Does:**
```
Team Structure:
  - SMB Team (company_size: 1-50)
    - Reps: Marcus, Alex
    - Manager: Jennifer

  - Enterprise Team (company_size: 201+)
    - Reps: Sarah, Michael
    - Manager: David

Lead Assignment:
  - IF company_size ≤ 50 → Assign to SMB Team
  - IF company_size ≥ 201 → Assign to Enterprise Team
```

**Technical Implementation:**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  lead_routing_rules JSONB
);

ALTER TABLE users ADD COLUMN team_id UUID REFERENCES teams(id);

-- Dashboard filtered by team
SELECT * FROM leads
WHERE assigned_to IN (SELECT id FROM users WHERE team_id = '{{current_user_team_id}}')
```

**Success Metric:**
- Supports 5+ teams, each with separate dashboards

**Effort:** 3 weeks

---

### 6.2 Custom Scoring Models per Team

**Why Build This:**
- SMB team values "immediate timeline" (20pts)
- Enterprise team values "large company size" (30pts) but doesn't care about timeline (big deals take 6 months)
- One scoring model doesn't fit all

**What It Does:**
```
SMB Scoring:
  - Company size: 0-15pts (capped lower)
  - Timeline: 0-30pts (more weight)

Enterprise Scoring:
  - Company size: 0-40pts (more weight)
  - Timeline: 0-10pts (less weight)
```

**Success Metric:**
- Each team's scoring correlates better with their close rates

**Effort:** 2 weeks

---

## Phase 7: Advanced Analytics (Months 19-21)

### 7.1 Predictive Pipeline Forecasting

**Why Build This:**
- CFO asks: "What's our revenue forecast for Q2?"
- Currently, sales manager eyeballs pipeline
- ML model predicts: "Based on 45 open opportunities, 12 will close, $360k revenue"

**How It Works:**
```python
# Train model on historical opportunities
features = [
  'lead_score',
  'days_since_qualified',
  'rep_id',
  'company_size',
  'deal_amount',
  'last_activity_days_ago'
]

target = 'closed_won' # 1 or 0

model = XGBoostClassifier()
model.fit(X_train, y_train)

# Predict close probability for open opps
for opp in open_opportunities:
  opp['win_probability'] = model.predict_proba(opp)[0][1]

forecast_revenue = sum(opp.deal_amount * opp.win_probability for opp in open_opportunities)
```

**Success Metric:**
- Forecast accuracy ±10% of actual close revenue

**Effort:** 4 weeks

---

### 7.2 Anomaly Detection

**Why Build This:**
- Sudden drop in lead quality → Alert marketing
- Rep's contact rate drops from 90% to 60% → Alert manager
- Notification delivery rate <90% → Alert engineering

**What It Does:**
```
Anomalies Detected:
  ⚠️ Avg lead score dropped to 42 (7-day avg: 58) → Check campaign targeting
  ⚠️ Marcus's contact rate: 65% (team avg: 88%) → Manager follow-up
  ⚠️ Hot leads >2hrs old: 5 (normal: 0-1) → Process breakdown
```

**Technical Implementation:**
- Calculate rolling averages (7-day, 30-day)
- Flag when current value >2 standard deviations from mean
- Send Slack alert to relevant team

**Success Metric:**
- Catch issues before they impact revenue (proactive vs reactive)

**Effort:** 2 weeks

---

## Roadmap Timeline

| Phase | Features                                  | Months | Effort | Value       |
|-------|-------------------------------------------|--------|--------|-------------|
| 1     | MVP (current)                             | 0-3    | 6 wks  | $430k ARR   |
| 2     | AI scoring + Enrichment                   | 4-6    | 5 wks  | +20% conv   |
| 3     | CRM integration (Salesforce + HubSpot)    | 7-9    | 6 wks  | 2hrs/rep/wk |
| 4     | Team collaboration (Notes + Assignment)   | 10-12  | 3 wks  | Better handoffs |
| 5     | Revenue attribution + ROI dashboard       | 13-15  | 5 wks  | Prove ROI   |
| 6     | Enterprise (Multi-team + Custom scoring)  | 16-18  | 5 wks  | 50+ rep orgs|
| 7     | Advanced analytics (Forecasting + Anomaly)| 19-21  | 6 wks  | Exec insights|

**Total Development:** 21 months to full enterprise platform

---

## Non-Roadmap (Explicitly NOT Building)

❌ **Mobile App**
**Why Not:** Sales reps work from laptops. Mobile-responsive web is sufficient. Native app is 6-month project with unclear ROI.

❌ **Video Calling Integration (Zoom, Calendly)**
**Why Not:** Commoditized. Use existing tools. Don't rebuild what already works.

❌ **Email Marketing Automation (Drip Campaigns)**
**Why Not:** HubSpot, Mailchimp do this better. Focus on our core value prop: lead scoring.

❌ **Built-in CRM (Full Pipeline Management)**
**Why Not:** We integrate with CRMs, we don't replace them. Salesforce has 20+ years of product development. Don't compete.

❌ **Live Chat Widget**
**Why Not:** Intercom, Drift specialize in this. We focus on form submissions, not chat.

---

## How to Prioritize: Feature Requests

**Decision Framework:**
```
New Feature Request: "Add SMS notifications for hot leads"

1. Customer demand?
   - 2 customers asked = 8% of customer base → LOW

2. Revenue impact?
   - Might improve response time 5-15 minutes → MEDIUM
   - Unlikely to change conversion materially → LOW

3. Technical feasibility?
   - Twilio API integration = 1 week → EASY

4. Competitive necessity?
   - No competitor offers this → LOW

VERDICT: Backlog (nice-to-have, not priority)
```

```
New Feature Request: "Salesforce integration"

1. Customer demand?
   - 15 customers asked = 60% of customer base → HIGH

2. Revenue impact?
   - Blocking 3 enterprise deals ($150k ARR) → HIGH
   - Saves 2 hrs/week per rep = $20k/year value → HIGH

3. Technical feasibility?
   - OAuth + API integration = 4 weeks → MEDIUM

4. Competitive necessity?
   - All competitors have this → HIGH

VERDICT: Build next quarter (high priority)
```

---

## Success Metrics by Phase

**Phase 2 (AI + Enrichment):**
- Lead-to-close conversion improves 20% (4.5% → 5.4%)
- 80% of leads auto-enriched

**Phase 3 (CRM Integration):**
- 90% of qualified leads pushed to CRM in <30s
- Sales reps report 2hrs/week time savings

**Phase 4 (Team Collaboration):**
- 2+ notes per qualified lead (adoption)
- Rep handoff success rate >95%

**Phase 5 (Revenue Attribution):**
- Can calculate ROI for every campaign source
- Marketing shifts budget to highest ROI channels

**Phase 6 (Enterprise Features):**
- Support 50+ rep organizations
- Win 3 enterprise deals ($150k+ ARR each)

**Phase 7 (Advanced Analytics):**
- Revenue forecast accuracy ±10%
- Catch anomalies before they impact revenue

---

This roadmap is **data-driven, customer-validated, and revenue-focused**. Every feature justifies its existence with business impact.
