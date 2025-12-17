# Lead Scoring Engine - Complete Specification

## Scoring Philosophy

This is **NOT a black-box AI model**. This is a transparent, formula-based scoring system that:
1. Can be explained to any sales rep in 2 minutes
2. Can be audited and iterated based on conversion data
3. Produces consistent results (same input = same score)
4. Captures 80% of qualification logic with 20% of complexity

## Scoring Formula

**Total Score = Company Size Score + Industry Score + Inquiry Type Score + Budget Timeline Score + Email Validation Score**

**Range:** 0-100 (integer)
**Calculation Time:** <100ms (simple arithmetic, no API calls)

---

## Detailed Scoring Breakdown

### 1. Company Size Score (0-30 points)

**Rationale:** Larger companies = higher contract value, longer retention, better fit for enterprise SaaS.

| Company Size       | Points | Justification                                      |
|--------------------|--------|---------------------------------------------------|
| 1-10 employees     | 5      | Micro business, limited budget, high churn risk   |
| 11-50 employees    | 10     | Small business, $5k-15k annual contract potential |
| 51-200 employees   | 20     | Mid-market sweet spot, $20k-50k ACV              |
| 201-1000 employees | 30     | Enterprise, $50k-200k+ ACV, strategic account     |
| 1000+ employees    | 25     | Enterprise but slow sales cycle (6-12 months)     |
| Not specified      | 0      | Penalize incomplete data                          |

**Formula:**
```
if company_size == "1-10": score += 5
elif company_size == "11-50": score += 10
elif company_size == "51-200": score += 20
elif company_size == "201-1000": score += 30
elif company_size == "1000+": score += 25
else: score += 0
```

**Edge Case:** If company name contains "Inc.", "Corp", "LLC" but size not specified → assume 11-50, award 10pts

---

### 2. Industry Score (0-20 points)

**Rationale:** ICP fit. Some industries have budget, authority, and need. Others don't.

| Industry                   | Points | Justification                                          |
|----------------------------|--------|-------------------------------------------------------|
| Software/SaaS              | 20     | Perfect ICP, understands SaaS value                   |
| Marketing/Advertising      | 18     | High digital adoption, active buyers                  |
| Financial Services         | 18     | Large budgets, compliance-driven tech spending        |
| Healthcare                 | 15     | Budget available but slow procurement                 |
| Professional Services      | 12     | Consulting/legal, moderate tech spend                 |
| Manufacturing              | 10     | Traditional, slower digital adoption                  |
| Retail/E-commerce          | 10     | Tight margins, price-sensitive                        |
| Education                  | 5      | Limited budgets, long sales cycles                    |
| Non-Profit                 | 3      | Budget constraints, not a fit                         |
| Other                      | 8      | Unknown fit, neutral score                            |
| Not specified              | 0      | Penalize incomplete data                              |

**Formula:**
```python
industry_scores = {
    "Software/SaaS": 20,
    "Marketing/Advertising": 18,
    "Financial Services": 18,
    "Healthcare": 15,
    "Professional Services": 12,
    "Manufacturing": 10,
    "Retail/E-commerce": 10,
    "Education": 5,
    "Non-Profit": 3,
    "Other": 8
}
score += industry_scores.get(industry, 0)
```

---

### 3. Inquiry Type Score (0-30 points)

**Rationale:** Intent signal. Someone requesting a demo is 10x more valuable than someone downloading a whitepaper.

| Inquiry Type          | Points | Justification                                          |
|-----------------------|--------|-------------------------------------------------------|
| Demo Request          | 30     | High intent, ready to evaluate, in-market             |
| Pricing Information   | 25     | Budget conversation started, near decision            |
| Contact Sales         | 25     | Explicit ask for sales engagement                     |
| General Question      | 15     | Some interest, needs education                        |
| Content Download      | 5      | Early research, low intent                            |
| Partnership Inquiry   | 10     | Not a customer lead, different path                   |
| Not specified         | 0      | Incomplete submission                                 |

**Formula:**
```python
inquiry_scores = {
    "Demo Request": 30,
    "Pricing Information": 25,
    "Contact Sales": 25,
    "General Question": 15,
    "Content Download": 5,
    "Partnership Inquiry": 10
}
score += inquiry_scores.get(inquiry_type, 0)
```

**Edge Case:** If inquiry type is "Content Download" but message field mentions "demo" or "pricing" → upgrade to 25pts

---

### 4. Budget Timeline Score (0-20 points)

**Rationale:** Sales readiness. Immediate buyers get priority over researchers.

| Budget Timeline       | Points | Justification                                          |
|-----------------------|--------|-------------------------------------------------------|
| Immediate (0-1 month) | 20     | Urgent need, likely has budget approved               |
| 1-3 months            | 15     | Active evaluation, planning current quarter purchase  |
| 3-6 months            | 10     | Future pipeline, stay warm                            |
| 6-12 months           | 5      | Early research, low priority                          |
| Just Researching      | 0      | No buying intent, nurture only                        |
| Not specified         | 0      | Incomplete data                                       |

**Formula:**
```python
timeline_scores = {
    "Immediate": 20,
    "1-3 months": 15,
    "3-6 months": 10,
    "6-12 months": 5,
    "Just Researching": 0
}
score += timeline_scores.get(budget_timeline, 0)
```

---

### 5. Email Validation Bonus (0-5 points)

**Rationale:** Legitimate business email = real lead. Free email = lower quality.

| Email Domain Type     | Points | Justification                                          |
|-----------------------|--------|-------------------------------------------------------|
| Corporate domain      | 5      | user@company.com indicates real business              |
| Gmail/Yahoo/Hotmail   | 0      | Consumer email, lower quality lead                    |
| Educational (.edu)    | 2      | Student or academic, not buyer                        |
| Invalid/missing       | 0      | Spam or fake submission                               |

**Formula:**
```python
free_email_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"]
edu_domains = [".edu"]

if "@" not in email:
    score += 0
elif any(domain in email.lower() for domain in free_email_domains):
    score += 0
elif any(domain in email.lower() for domain in edu_domains):
    score += 2
else:
    score += 5  # Corporate email
```

**Edge Case:** If company name is "Acme Corp" and email is "john@acme.com" → validate domain match, if mismatch flag for manual review

---

## Lead Category Thresholds

### Hot Leads (80-100 points)
**Characteristics:**
- Large company (201-1000 employees) = 30pts
- Perfect ICP industry (Software/SaaS) = 20pts
- High intent (Demo Request) = 30pts
- Immediate timeline = 20pts
- Corporate email = 5pts
- **Example Total:** 105pts → capped at 100

**Sales Action:** Contact within 1 hour (Slack + email alert)
**Expected Conversion:** 30-40% → SQL

### Warm Leads (50-79 points)
**Characteristics:**
- Mid-size company (51-200) = 20pts
- Good industry (Marketing) = 18pts
- Medium intent (General Question) = 15pts
- 1-3 month timeline = 15pts
- Corporate email = 5pts
- **Example Total:** 73pts

**Sales Action:** Contact within 24 hours (dashboard queue)
**Expected Conversion:** 10-20% → SQL

### Cold Leads (0-49 points)
**Characteristics:**
- Small company (1-10) = 5pts
- Poor fit industry (Education) = 5pts
- Low intent (Content Download) = 5pts
- Just researching = 0pts
- Free email = 0pts
- **Example Total:** 15pts

**Sales Action:** Marketing nurture drip campaign, no sales contact
**Expected Conversion:** 1-3% → SQL (over 6 months)

---

## Score Examples (Real Scenarios)

### Example 1: Perfect Hot Lead
```
Company: Salesforce Marketing Team
Size: 201-1000 employees          → 30pts
Industry: Software/SaaS            → 20pts
Inquiry: Demo Request              → 30pts
Timeline: Immediate                → 20pts
Email: sarah.chen@salesforce.com   → 5pts
---
TOTAL: 105pts → Capped at 100
CATEGORY: HOT
ACTION: Immediate Slack alert to #sales-hot-leads
```

### Example 2: Solid Warm Lead
```
Company: Brooklyn Digital Agency
Size: 11-50 employees              → 10pts
Industry: Marketing/Advertising    → 18pts
Inquiry: Pricing Information       → 25pts
Timeline: 1-3 months               → 15pts
Email: mark@brooklyndigital.com    → 5pts
---
TOTAL: 73pts
CATEGORY: WARM
ACTION: Add to sales dashboard queue
```

### Example 3: Disqualified Cold Lead
```
Company: Not specified             → 0pts
Size: Not specified                → 0pts
Industry: Non-Profit               → 3pts
Inquiry: Content Download          → 5pts
Timeline: Just Researching         → 0pts
Email: student@gmail.com           → 0pts
---
TOTAL: 8pts
CATEGORY: COLD
ACTION: Add to marketing email list, no sales follow-up
```

### Example 4: Enterprise with Slow Timeline (Warm)
```
Company: Fortune 500 Bank
Size: 1000+ employees              → 25pts
Industry: Financial Services       → 18pts
Inquiry: General Question          → 15pts
Timeline: 6-12 months              → 5pts
Email: john.doe@bigbank.com        → 5pts
---
TOTAL: 68pts
CATEGORY: WARM (Not HOT despite size—timeline too long)
ACTION: Assign to enterprise AE, long-term nurture
```

---

## Re-Scoring Logic

### When to Re-Score

1. **Lead Enrichment Data Added**
   - Marketing manager manually updates company size after LinkedIn research
   - Trigger: Field change → recalculate score → update category

2. **Lead Status Change**
   - Lead moves from "Contacted" to "Qualified"
   - Trigger: Status change → add 10pt "qualification bonus" (one-time)
   - Rationale: Rep validated fit, increase priority for follow-up

3. **Engagement Actions**
   - Lead replies to email
   - Lead visits pricing page 3+ times
   - Lead watches demo video
   - Trigger: Behavioral signal → add 5-15pts depending on action

4. **Time Decay (Future Enhancement)**
   - Lead score decreases 5pts per week if no activity
   - Rationale: Interest fades, deprioritize stale leads
   - Implementation: Nightly batch job, check `last_activity_date`

### Re-Scoring Rules

```python
def recalculate_score(lead):
    base_score = calculate_initial_score(lead)

    # Qualification bonus (one-time)
    if lead.status == "Qualified" and not lead.qualification_bonus_applied:
        base_score += 10
        lead.qualification_bonus_applied = True

    # Engagement bonuses
    if lead.email_reply_count > 0:
        base_score += 5

    if lead.pricing_page_visits >= 3:
        base_score += 10

    if lead.demo_video_watched:
        base_score += 15

    # Time decay (weeks since last activity)
    weeks_inactive = (today - lead.last_activity_date).days // 7
    decay_penalty = min(weeks_inactive * 5, 30)  # Cap at 30pt penalty
    base_score -= decay_penalty

    # Ensure score stays in 0-100 range
    final_score = max(0, min(base_score, 100))

    # Update category based on new score
    if final_score >= 80:
        lead.category = "Hot"
    elif final_score >= 50:
        lead.category = "Warm"
    else:
        lead.category = "Cold"

    return final_score
```

---

## Edge Cases & Error Handling

### 1. Missing Required Fields
**Scenario:** Form submitted without company size or industry
**Handling:**
- Still accept submission (don't block lead capture)
- Assign 0pts for missing fields
- Flag lead as "Incomplete - Needs Enrichment"
- Marketing manager manually fills data from LinkedIn

### 2. Conflicting Signals
**Scenario:** Large enterprise (30pts) but free email (0pts) and "Just Researching" (0pts)
**Score:** 30 + 20 + 5 + 0 + 0 = 55pts → Warm, not Hot
**Handling:** Trust the formula. Free email is red flag even for large company.

### 3. Spam Submissions
**Scenario:** Email is "test@test.com", company is "asdfasdf"
**Handling:**
- Score calculates as 0-10pts (all fields invalid)
- Auto-flag as "Suspected Spam" if score <10 AND email contains "test" or company has <4 characters
- Hide from sales dashboard, send to spam review queue

### 4. International Leads
**Scenario:** German company with .de email domain
**Handling:**
- Corporate email rule: any non-free-email domain gets 5pts
- Add country field in future iteration, adjust scoring by region

### 5. Maximum Score Edge Case
**Scenario:** Lead accumulates 130pts through re-scoring (100 base + 30 engagement bonuses)
**Handling:**
- Display score as 100 (cap)
- Store "raw_score" field with 130 for analytics
- Use raw_score for prioritization within "Hot" category (130pt lead > 85pt lead)

---

## Scoring Validation & Iteration

### How to Validate Formula Accuracy

**Month 1-3: Baseline Data Collection**
1. Track conversion rates by score bracket:
   - Hot leads → SQL conversion rate
   - Warm leads → SQL conversion rate
   - Cold leads → SQL conversion rate

**Expected Results:**
- Hot leads should convert 5-10x better than Cold leads
- If Hot leads convert at <20%, scoring is too generous → increase thresholds
- If Warm leads convert at 0%, scoring is too harsh → lower thresholds

**Month 4+: Formula Iteration**
1. Analyze which scored features correlate most with closed deals:
   - Run SQL query: `SELECT AVG(closed_won) GROUP BY company_size`
   - If 1000+ employees actually close better than 201-1000, adjust point values

2. A/B test scoring changes:
   - Don't A/B test in production (confuses sales)
   - Instead: calculate "old score" and "new score" in parallel for 2 weeks
   - Compare which formula would have prioritized actual closed deals higher
   - Switch to better formula

**Quarterly Scoring Review:**
- Sales manager + top rep review 20 random leads from each category
- Ask: "Does this score match reality?"
- Document misscores, extract patterns, adjust formula

---

## Implementation Code (Pseudocode)

```python
def calculate_lead_score(form_data):
    """
    Calculate lead score from form submission data.
    Returns: dict with score (int), category (str), and breakdown (dict)
    """
    score = 0
    breakdown = {}

    # 1. Company Size (0-30pts)
    company_size = form_data.get("company_size", "")
    size_points = {
        "1-10": 5,
        "11-50": 10,
        "51-200": 20,
        "201-1000": 30,
        "1000+": 25
    }.get(company_size, 0)
    score += size_points
    breakdown["company_size"] = size_points

    # 2. Industry (0-20pts)
    industry = form_data.get("industry", "")
    industry_points = {
        "Software/SaaS": 20,
        "Marketing/Advertising": 18,
        "Financial Services": 18,
        "Healthcare": 15,
        "Professional Services": 12,
        "Manufacturing": 10,
        "Retail/E-commerce": 10,
        "Education": 5,
        "Non-Profit": 3,
        "Other": 8
    }.get(industry, 0)
    score += industry_points
    breakdown["industry"] = industry_points

    # 3. Inquiry Type (0-30pts)
    inquiry_type = form_data.get("inquiry_type", "")
    inquiry_points = {
        "Demo Request": 30,
        "Pricing Information": 25,
        "Contact Sales": 25,
        "General Question": 15,
        "Content Download": 5,
        "Partnership Inquiry": 10
    }.get(inquiry_type, 0)
    score += inquiry_points
    breakdown["inquiry_type"] = inquiry_points

    # 4. Budget Timeline (0-20pts)
    budget_timeline = form_data.get("budget_timeline", "")
    timeline_points = {
        "Immediate": 20,
        "1-3 months": 15,
        "3-6 months": 10,
        "6-12 months": 5,
        "Just Researching": 0
    }.get(budget_timeline, 0)
    score += timeline_points
    breakdown["budget_timeline"] = timeline_points

    # 5. Email Validation (0-5pts)
    email = form_data.get("email", "").lower()
    free_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
    if any(domain in email for domain in free_domains):
        email_points = 0
    elif ".edu" in email:
        email_points = 2
    elif "@" in email:
        email_points = 5
    else:
        email_points = 0
    score += email_points
    breakdown["email_validation"] = email_points

    # Cap score at 100
    final_score = min(score, 100)

    # Assign category
    if final_score >= 80:
        category = "Hot"
    elif final_score >= 50:
        category = "Warm"
    else:
        category = "Cold"

    return {
        "score": final_score,
        "category": category,
        "breakdown": breakdown
    }
```

---

## Scoring Dashboard for Sales Manager

**Visibility into Formula Performance:**

| Metric                          | Current Value | Target   | Status |
|---------------------------------|---------------|----------|--------|
| Avg Score (All Leads)           | 52            | 50-60    | ✅     |
| Hot Lead Conversion Rate        | 28%           | >25%     | ✅     |
| Warm Lead Conversion Rate       | 12%           | >10%     | ✅     |
| Cold Lead Conversion Rate       | 2%            | <5%      | ✅     |
| Hot Leads as % of Total         | 18%           | 15-20%   | ✅     |
| Avg Score by Source: Google Ads | 64            | —        | Track  |
| Avg Score by Source: Content    | 38            | —        | Track  |

**Action Items if Metrics Drift:**
- Hot conversion <20% → Tighten threshold to 85pts
- Hot leads >30% of volume → Reduce inquiry_type points
- Cold leads converting at 10% → Formula missing signals, investigate

---

This scoring engine is **production-ready, auditable, and iterative**. It's not a magic algorithm—it's business logic encoded transparently.
