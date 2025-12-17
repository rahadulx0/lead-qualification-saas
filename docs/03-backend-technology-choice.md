# Backend Technology Stack - Decision & Justification

## Decision Summary

**CHOSEN STACK: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)**

**Why:** Best balance of speed-to-market, SQL database power, built-in auth, and enterprise scalability at MVP cost.

---

## Evaluation Criteria

We evaluated based on 7 criteria critical for SaaS success:

| Criterion                     | Weight | Firebase | Supabase | Node.js (AWS Lambda) |
|-------------------------------|--------|----------|----------|---------------------|
| 1. Speed to MVP               | 25%    | 8/10     | 9/10     | 5/10                |
| 2. Database Query Flexibility | 20%    | 4/10     | 10/10    | 10/10               |
| 3. Cost at Scale              | 15%    | 6/10     | 9/10     | 7/10                |
| 4. Auth & Security Built-in   | 15%    | 9/10     | 9/10     | 3/10                |
| 5. Learning Curve             | 10%    | 7/10     | 8/10     | 6/10                |
| 6. Portfolio Value            | 10%    | 7/10     | 8/10     | 9/10                |
| 7. Future Scalability         | 5%     | 8/10     | 9/10     | 10/10               |
| **WEIGHTED TOTAL**            |        | **7.0**  | **8.8**  | **6.7**             |

---

## Option 1: Firebase (Firestore + Cloud Functions + Auth)

### Pros

✅ **Extremely Fast Setup**
- Add Firebase SDK, configure project, start coding
- Firestore auto-scales, no database setup
- Built-in authentication (Google, email, etc.)

✅ **Real-time Capabilities**
- Firestore listeners for live dashboard updates
- Sales dashboard refreshes when new lead arrives (no polling)

✅ **Google Cloud Integration**
- Seamless integration with GCP services
- Generous free tier (50k reads/day, 20k writes/day)

✅ **Security Rules Built-in**
- Firestore security rules protect data at database level
- No backend API = smaller attack surface

### Cons

❌ **NoSQL Limitations**
- Firestore queries are limited (no JOINs, complex aggregations)
- Dashboard query: "Show leads where category='Hot' AND status='New' sorted by score"
  → Requires composite index for every filter combination
- Analytics queries (AVG score by source) require denormalization or client-side calculation

❌ **Cost Unpredictability**
- Charged per read/write operation
- Dashboard page with 50 leads = 50 reads
- Refresh 100 times/day = 5,000 reads
- At scale (10 users, 500 leads): ~150k reads/day = **$45/month just for dashboard**

❌ **Vendor Lock-in**
- Firestore query syntax is Firebase-specific
- Migrating to SQL later requires full rewrite

❌ **Limited Complex Logic**
- Cloud Functions are serverless (good for API endpoints)
- But cold starts (500ms-2s) hurt user experience
- Can't run cron jobs easily (need Cloud Scheduler = extra service)

❌ **Not SQL**
- Most dev teams know SQL, fewer know Firestore queries
- SQL is interview gold standard
- Portfolio value: "I know Firebase" < "I know PostgreSQL"

### Use Case Fit

**Firebase is BEST for:**
- Mobile apps with offline sync
- Real-time chat/collaboration
- Prototypes where speed > cost

**Firebase is WORST for:**
- Complex reporting/analytics
- Systems requiring flexible querying
- Projects needing to demonstrate SQL skills

### Cost Estimate (At 500 leads/month)

- Firestore reads: 150k/month = $0 (within free tier)
- Firestore writes: 20k/month = $0 (within free tier)
- Cloud Functions: 100k invocations = $0 (within free tier)
- **Total: $0-10/month** (MVP scale)

**At 10k leads/month:**
- Reads: 3M/month = **$36/month**
- Writes: 400k/month = **$48/month**
- Functions: 2M invocations = **$40/month**
- **Total: $124/month**

---

## Option 2: Supabase (PostgreSQL + PostgREST API + Auth + Edge Functions)

### Pros

✅ **SQL Database Power**
- Full PostgreSQL (world's most advanced open-source DB)
- Complex queries: `SELECT *, AVG(lead_score) OVER (PARTITION BY industry)...`
- JOINs, aggregations, window functions—everything works
- Dashboard query: Single SQL statement, no denormalization needed

✅ **Auto-Generated REST API**
- Define database schema → API endpoints appear automatically
- `GET /rest/v1/leads?category=eq.Hot&order=lead_score.desc`
- No need to write CRUD endpoints manually

✅ **Built-in Auth (Like Firebase)**
- Row-level security (RLS) policies
- JWT-based authentication
- Social login (Google, GitHub) + email/password

✅ **Real-time Subscriptions**
- Listen to database changes: `supabase.from('leads').on('INSERT', callback)`
- Dashboard updates live when new lead arrives

✅ **Edge Functions (Serverless)**
- Deploy JavaScript/TypeScript functions
- Run scoring logic, send notifications
- Faster cold starts than AWS Lambda (~100ms)

✅ **Transparent Pricing**
- $25/month for Pro plan: 8GB database, 100GB bandwidth, 500k Edge Function requests
- Predictable costs (not per-operation like Firebase)

✅ **Open Source**
- Can self-host if needed (zero vendor lock-in)
- Supabase is a wrapper around Postgres—can export DB and run anywhere
- Portfolio value: Shows you understand open-source infrastructure

✅ **Postgres Skills = Career Value**
- Postgres is industry standard (Stripe, Notion, Figma use it)
- "Built with Postgres" > "Built with Firestore" in interviews

### Cons

❌ **Slightly Slower Setup Than Firebase**
- Need to define schema (CREATE TABLE statements)
- Firebase: start coding immediately
- Supabase: 30 minutes to design schema first

❌ **Learning Curve (If No SQL Experience)**
- Need to know SQL (though better for portfolio)
- Firebase is more "magical" (good and bad)

❌ **Not Fully Serverless**
- Database is always running (even if no requests)
- Firebase Firestore = pay-per-use, $0 if no traffic
- Supabase = $25/month minimum (but includes more)

### Use Case Fit

**Supabase is BEST for:**
- B2B SaaS with complex queries
- Dashboards with filtering, sorting, aggregation
- Projects where SQL skills matter
- Systems needing predictable costs

**Supabase is WORST for:**
- Extreme scale (Firebase/DynamoDB better for 100M+ ops/day)
- Projects needing ultra-low latency globally (Firebase has more edge locations)

### Cost Estimate (At 500 leads/month)

- Free tier: 500MB database, 2GB bandwidth = **$0/month** (MVP fits)
- Pro tier: $25/month (upgrade when database >500MB or need more storage)

**At 10k leads/month:**
- Pro plan: $25/month (includes 8GB database, plenty of headroom)
- Edge Functions: 500k requests included, then $2 per 1M requests
- **Total: $25-30/month**

---

## Option 3: Node.js on AWS Lambda + RDS PostgreSQL

### Pros

✅ **Full Control**
- Write custom API logic, no constraints
- Use any npm package
- Deploy to AWS, GCP, Vercel, or any platform

✅ **Industry Standard Stack**
- Node.js + Express + PostgreSQL = FAANG interview standard
- Shows you can build production APIs from scratch
- Highest portfolio value (demonstrates more technical depth)

✅ **PostgreSQL Database**
- Same SQL power as Supabase
- RDS managed database (auto-backups, scaling)

✅ **Serverless Functions**
- AWS Lambda scales automatically
- Pay per invocation (cheap at low scale)

### Cons

❌ **Longest Time to MVP**
- Setup: RDS instance, Lambda functions, API Gateway, IAM roles
- Write all CRUD endpoints manually (no auto-generated API)
- Configure deployment pipeline (CloudFormation, Terraform, or Serverless Framework)
- Estimated setup time: **2-3 weeks**

❌ **More Moving Parts**
- RDS (database), Lambda (functions), API Gateway (routing), IAM (security), CloudWatch (logs)
- Each service has its own configuration
- More things that can break

❌ **No Built-in Auth**
- Need to implement JWT auth from scratch OR use Auth0/Cognito (another service)
- Supabase/Firebase include auth out-of-the-box

❌ **Cold Starts**
- Lambda cold starts: 500ms-2s (hurts API response time)
- Need to configure VPC if Lambda connects to RDS (adds complexity)

❌ **Cost Complexity**
- RDS: $15/month (t3.micro instance, always running)
- Lambda: $0.20 per 1M requests (cheap)
- API Gateway: $3.50 per 1M requests
- NAT Gateway (if Lambda in VPC): **$32/month** (fixed cost, ouch)
- **Total: $50-60/month minimum**, vs Supabase $25/month

### Use Case Fit

**Node.js + AWS Lambda is BEST for:**
- Senior engineer portfolio (shows you can build from scratch)
- Companies already on AWS
- Projects needing custom business logic (complex integrations)

**Node.js + AWS Lambda is WORST for:**
- MVPs (too slow to build)
- Solo projects (too much to manage)
- Junior/mid-level portfolios (overengineered)

### Cost Estimate (At 500 leads/month)

- RDS t3.micro: $15/month
- Lambda: ~10k invocations = $0 (free tier)
- API Gateway: 10k requests = $0 (free tier)
- **Total: $15/month** (but takes 3x longer to build)

---

## Final Decision: Supabase

### Why Supabase Wins

**1. SQL Database (Critical for This Project)**
- Lead scoring dashboard requires complex queries:
  - "Show hot leads assigned to me, sorted by score, with last activity date"
  - `SELECT * FROM leads WHERE category='Hot' AND assigned_to='user-123' ORDER BY lead_score DESC, last_activity_date DESC`
- Firebase requires denormalization + composite indexes (fragile, hard to maintain)
- Supabase: Just write SQL

**2. Speed to MVP (Critical for Portfolio)**
- Can build and deploy MVP in **4-6 weeks**
- Firebase would save 1 week but create technical debt (NoSQL limitations)
- Node.js + AWS would add 2 weeks of setup time (not worth it for MVP)

**3. Cost Predictability**
- $0/month (free tier) → $25/month (Pro tier) → $299/month (Team tier)
- Firebase costs scale with usage (harder to predict)
- AWS has too many line items (RDS + Lambda + API Gateway + NAT Gateway)

**4. Portfolio Value**
- "Built with Supabase (PostgreSQL)" shows:
  - SQL skills ✓
  - Modern stack (Supabase is hot in startup world) ✓
  - Smart tool selection (pragmatic, not overengineered) ✓
- "Built with Firebase" → Might be seen as "taking shortcuts"
- "Built with AWS Lambda" → Might be seen as "overengineered for MVP"

**5. Real-time Features (Nice-to-Have)**
- Sales dashboard can auto-refresh when new hot lead arrives
- Supabase realtime subscriptions: `supabase.from('leads').on('INSERT', ...)`
- Better UX than polling API every 30 seconds

**6. Future Scalability**
- Postgres scales to millions of rows (Notion has billions)
- Can upgrade to dedicated Postgres instance if needed
- Open-source = can self-host or migrate to AWS RDS later (no lock-in)

---

## Implementation Plan with Supabase

### Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────┐
│  USER (Browser)                                         │
└─────────┬───────────────────────────────────────────────┘
          │
          │ 1. Submit form (POST)
          ↓
┌─────────────────────────────────────────────────────────┐
│  WEBFLOW (Public Pages)                                 │
│  - /get-demo (form)                                     │
│  - /thank-you (confirmation)                            │
└─────────┬───────────────────────────────────────────────┘
          │
          │ 2. API call to Supabase
          ↓
┌─────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTION                                 │
│  POST /functions/v1/create-lead                         │
│  - Validate form data                                   │
│  - Calculate lead score                                 │
│  - Insert into Postgres                                 │
│  - Trigger notifications                                │
└─────────┬───────────────────────────────────────────────┘
          │
          │ 3. Write to database
          ↓
┌─────────────────────────────────────────────────────────┐
│  SUPABASE POSTGRES DATABASE                             │
│  Tables: leads, users, activities                       │
└─────────┬───────────────────────────────────────────────┘
          │
          │ 4. Realtime event (Hot lead created)
          ↓
┌─────────────────────────────────────────────────────────┐
│  SUPABASE EDGE FUNCTION                                 │
│  POST /functions/v1/send-notification                   │
│  - Check lead.category == "Hot"                         │
│  - Send Slack webhook                                   │
│  - Send email via SendGrid                              │
└─────────────────────────────────────────────────────────┘
          │
          │ 5. HTTP request
          ↓
┌──────────────────────────┐    ┌───────────────────────┐
│  SLACK API               │    │  SENDGRID API         │
│  (Hot lead alert)        │    │  (Email notification) │
└──────────────────────────┘    └───────────────────────┘


┌─────────────────────────────────────────────────────────┐
│  SALES REP (Dashboard)                                  │
│  - Logs into dashboard.yourcompany.com                  │
│  - Supabase Auth (email/password)                       │
└─────────┬───────────────────────────────────────────────┘
          │
          │ 6. Query leads
          ↓
┌─────────────────────────────────────────────────────────┐
│  SUPABASE REST API                                      │
│  GET /rest/v1/leads?category=eq.Hot&order=score.desc   │
│  (Auto-generated from database schema)                  │
└─────────┬───────────────────────────────────────────────┘
          │
          │ 7. Return JSON
          ↓
┌─────────────────────────────────────────────────────────┐
│  WEBFLOW (Protected Page)                               │
│  /dashboard (embedded JavaScript fetches Supabase API)  │
│  - Lead table                                           │
│  - Filters, search                                      │
│  - Status update buttons                                │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack Components

| Component              | Technology                  | Purpose                          |
|------------------------|-----------------------------|----------------------------------|
| Public Pages           | Webflow                     | Lead capture form, marketing     |
| Dashboard (Protected)  | Webflow + Custom JS         | Sales rep UI, lead management    |
| Database               | Supabase Postgres           | Lead data, users, activities     |
| API (CRUD)             | Supabase REST API (auto)    | Auto-generated from schema       |
| Backend Logic          | Supabase Edge Functions     | Scoring, notifications           |
| Authentication         | Supabase Auth               | Login for dashboard              |
| Real-time              | Supabase Realtime           | Live dashboard updates           |
| Notifications          | SendGrid (email), Slack API | Hot lead alerts                  |
| Hosting                | Webflow + Supabase Cloud    | Fully managed, no DevOps         |

### Development Timeline

| Week | Tasks                                                                 |
|------|-----------------------------------------------------------------------|
| 1    | Setup Supabase project, create database schema, deploy to Supabase   |
| 2    | Build Webflow form, connect to Supabase Edge Function                |
| 3    | Build scoring logic (Edge Function), test with sample leads           |
| 4    | Build Supabase dashboard (protected page), implement lead table       |
| 5    | Add notifications (Slack, email), test hot lead flow                  |
| 6    | Polish UI, add analytics, deploy to production, test end-to-end       |

**Total: 6 weeks to production-ready MVP**

---

## Alternatives Considered (and Rejected)

### Rejected: Airtable + Zapier (No-Code)
**Why Not:**
- Airtable is not a real database (limited to 50k records on Pro plan)
- Can't build custom scoring logic (would need Zapier code steps)
- No real-time capabilities
- Not credible in portfolio ("I used Airtable" ≠ engineering skills)

### Rejected: MongoDB Atlas + Node.js
**Why Not:**
- NoSQL like Firestore (same query limitations)
- If we're writing Node.js code anyway, might as well use SQL (Supabase wins)

### Rejected: Django + Heroku
**Why Not:**
- Django is Python (would need to learn if not already proficient)
- Heroku costs $7/month minimum (dyno), RDS extra cost
- Slower than Supabase for this use case (more boilerplate)

---

## Risk Mitigation

### Risk 1: Supabase Shuts Down (Startup Risk)

**Likelihood:** Low (raised $116M Series B, 1M+ developers)
**Impact:** High (would need to rebuild backend)

**Mitigation:**
- Supabase is open-source → Can self-host on AWS/GCP
- Postgres database can be exported and migrated to any Postgres host
- Edge Functions are TypeScript → Can redeploy to Vercel/Cloudflare Workers

**Action:** Document migration path in deployment guide

### Risk 2: Supabase Free Tier Changes

**Likelihood:** Medium (SaaS companies change free tiers often)
**Impact:** Low ($25/month Pro plan is affordable)

**Mitigation:**
- Build assuming Pro plan pricing ($25/month)
- Monitor usage weekly (Supabase dashboard shows stats)

### Risk 3: Postgres Scalability Limits

**Likelihood:** Very Low (Postgres scales to billions of rows)
**Impact:** Low (can upgrade to dedicated instance)

**Mitigation:**
- Design schema with indexes (already done)
- Plan archival strategy (move old leads to cold storage)
- Supabase offers read replicas if needed

---

## Conclusion

**Supabase is the optimal choice** for this project because it:
1. Provides SQL database power (essential for complex queries)
2. Accelerates MVP development (4-6 weeks vs 8-10 weeks with AWS)
3. Demonstrates modern, pragmatic engineering (not overengineered, not underengineered)
4. Costs $0-25/month (vs Firebase's unpredictable costs, AWS's $50+ minimum)
5. Shows portfolio-worthy skills (PostgreSQL, REST APIs, serverless functions)

**Decision made with confidence.**
