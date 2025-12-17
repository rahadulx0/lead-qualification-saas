# Analytics & KPI Framework

## Business Metrics (What Executives Care About)

### Primary KPIs

**1. Revenue Impact**
- **Formula:** (Qualified Leads × Average Deal Size × Close Rate) - System Cost
- **Target:** $1M+ additional annual revenue Year 1
- **Measurement:** Compare closed deals before/after system implementation

**2. Lead-to-Opportunity Conversion Rate**
- **Formula:** (Leads marked "Opportunity" / Total Leads) × 100
- **Baseline:** 3% industry average
- **Target:** 4.5% (50% improvement)
- **Dashboard Location:** Manager analytics tab

**3. Average Response Time**
- **Formula:** AVG(time_to_first_contact - lead_created_at)
- **Baseline:** 24 hours
- **Target:** <2 hours (92% improvement)
- **Business Impact:** 21x higher conversion with <5min response time

---

## Operational Metrics (What Sales Managers Care About)

### Lead Quality Metrics

**4. Hot Lead Response Rate Within 1 Hour**
- **Formula:** (Hot leads contacted within 1hr / Total hot leads) × 100
- **Target:** 95%
- **Red Flag:** <80% indicates process breakdown

**5. Average Lead Score**
- **Formula:** AVG(lead_score) across all leads
- **Target Range:** 50-60 (balanced funnel)
- **Interpretation:**
  - >70: Marketing generating high-quality traffic (good)
  - <40: Too many unqualified leads (bad)

**6. Score Accuracy (Predictive Power)**
- **Formula:** Correlation between lead_score and actual SQL conversion
- **Measurement:** Monthly analysis: Do 80+ scored leads convert 5x better than 0-49?
- **Target:** r² > 0.6 (strong correlation)

### Sales Productivity Metrics

**7. Rep Utilization Rate**
- **Formula:** (Qualified + Opportunities / Total Leads Contacted) × 100
- **Target:** >30% (reps spend time on real opportunities)
- **Baseline:** 15% (before system)

**8. Leads Per Rep Per Week**
- **Formula:** Total leads assigned / Active reps / Weeks
- **Target:** 15-25 per rep (balanced workload)
- **Alert:** >30 = rep overloaded, <10 = underutilized

---

## System Health Metrics (What Engineers Care About)

**9. Scoring Engine Accuracy**
- **Measurement:** % of leads where scoring breakdown matches reality
- **Audit Process:** Weekly review 20 random leads, compare score vs actual fit
- **Target:** 85%+ scoring accuracy

**10. Notification Delivery SLA**
- **Formula:** (Notifications sent successfully / Total notifications) × 100
- **Target:** 99.5%
- **Alert Threshold:** <95%

**11. Dashboard Query Performance**
- **Formula:** P95 load time for main dashboard query
- **Target:** <500ms
- **Red Flag:** >2 seconds

---

## Campaign Performance Metrics

**12. Lead Quality by Source**
| Source         | Avg Score | Volume/Month | SQL Conversion | Cost Per SQL |
|----------------|-----------|--------------|----------------|--------------|
| Google Ads     | 68        | 150          | 18%            | $125         |
| Organic Search | 52        | 80           | 12%            | $0           |
| LinkedIn Ads   | 74        | 45           | 24%            | $180         |
| Content DL     | 38        | 200          | 3%             | $15          |

**Action Items:**
- If Google Ads avg score < 50: Adjust targeting, too broad
- If any source has conversion <5%: Consider pausing or optimizing

---

## Funnel Analytics

### Lead Status Funnel

```
500 Total Leads/Month
    ↓
    ├─ 90 Hot (18%)      → 45 Contacted → 27 Qualified → 8 Opportunities → 3 Closed-Won
    ├─ 250 Warm (50%)    → 180 Contacted → 54 Qualified → 12 Opportunities → 4 Closed-Won
    └─ 160 Cold (32%)    → Nurture Track → 8 upgraded to Warm → 1 Closed-Won
```

**Conversion Rates by Category:**
- Hot: 3.3% close rate
- Warm: 1.6% close rate
- Cold: 0.6% close rate (via nurture)
- **Overall: 1.6% close rate** (vs 1.2% before system)

**Bottleneck Analysis:**
- If Contacted → Qualified drops: Poor sales discovery questions
- If Qualified → Opportunity drops: Pricing objections or budget issues

---

## Dashboard Implementation

### Manager Analytics View (SQL Query)

```sql
-- Daily Performance Snapshot
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE category = 'Hot') as hot_leads,
  COUNT(*) FILTER (WHERE category = 'Warm') as warm_leads,
  COUNT(*) FILTER (WHERE category = 'Cold') as cold_leads,
  ROUND(AVG(lead_score), 1) as avg_score,
  COUNT(*) FILTER (WHERE status = 'Contacted') as contacted,
  COUNT(*) FILTER (WHERE status = 'Qualified') as qualified,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Contacted') / COUNT(*), 1) as contact_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (last_activity_date - created_at))/60) FILTER (WHERE status = 'Contacted'), 0) as avg_response_minutes
FROM leads
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND is_deleted = FALSE
GROUP BY DATE(created_at)
ORDER BY date DESC
```

### Rep Performance Leaderboard

```sql
-- Rep Performance (Last 30 Days)
SELECT
  u.full_name,
  COUNT(l.id) as leads_assigned,
  COUNT(l.id) FILTER (WHERE l.status = 'Contacted') as contacted,
  COUNT(l.id) FILTER (WHERE l.status = 'Qualified') as qualified,
  COUNT(l.id) FILTER (WHERE l.status = 'Opportunity') as opportunities,
  ROUND(100.0 * COUNT(l.id) FILTER (WHERE l.status = 'Contacted') / NULLIF(COUNT(l.id), 0), 1) as contact_rate,
  ROUND(100.0 * COUNT(l.id) FILTER (WHERE l.status = 'Qualified') / NULLIF(COUNT(l.id) FILTER (WHERE l.status = 'Contacted'), 0), 1) as qualification_rate,
  ROUND(AVG(EXTRACT(EPOCH FROM (l.last_activity_date - l.created_at))/60) FILTER (WHERE l.status = 'Contacted'), 0) as avg_response_minutes
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
  AND l.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND l.is_deleted = FALSE
WHERE u.role = 'rep' AND u.is_active = TRUE
GROUP BY u.id, u.full_name
ORDER BY qualification_rate DESC
```

### Source Attribution Report

```sql
-- Campaign Performance
SELECT
  COALESCE(utm_source, 'Direct') as source,
  COALESCE(utm_campaign, 'N/A') as campaign,
  COUNT(*) as leads,
  ROUND(AVG(lead_score), 1) as avg_score,
  COUNT(*) FILTER (WHERE category = 'Hot') as hot_leads,
  COUNT(*) FILTER (WHERE status = 'Qualified') as qualified,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'Qualified') / COUNT(*), 1) as sql_rate
FROM leads
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND is_deleted = FALSE
GROUP BY utm_source, utm_campaign
ORDER BY qualified DESC
```

---

## Alerts & Notifications

### Automated Alerts

**Critical Alerts (Immediate Slack/Email):**
1. Hot lead >1 hour old, still status = "New"
2. Notification delivery rate <90% in last hour
3. Dashboard query time >3 seconds
4. Daily lead volume <50% of 7-day average (pipeline risk)

**Warning Alerts (Daily Summary):**
1. Avg response time >4 hours (target is 2hrs)
2. >20% of leads in "Needs Review" status
3. Rep with >40 assigned leads (capacity breach)
4. Scoring accuracy <80% (weekly audit)

---

## Reporting Cadence

| Report                     | Audience        | Frequency | Format          |
|----------------------------|-----------------|-----------|-----------------|
| Daily Lead Summary         | Sales Manager   | Daily 9am | Slack message   |
| Weekly Performance Review  | Sales Team      | Monday    | PDF dashboard   |
| Monthly Funnel Analysis    | Exec Team       | Month-end | Presentation    |
| Quarterly Scoring Audit    | Product Team    | Quarterly | Analysis doc    |

---

## Success Criteria (6-Month Review)

The system succeeds if:

✅ **Hot lead response time <2 hours:** 95% of time
✅ **Overall lead-to-opportunity rate:** 4%+ (vs 3% baseline)
✅ **Sales capacity utilization:** 30%+ (reps focus on qualified leads)
✅ **Marketing ROI visibility:** Can attribute revenue by campaign source
✅ **Sales team satisfaction:** Net Promoter Score >7/10

---

This analytics framework is **measurable, actionable, and tied to business outcomes**.
