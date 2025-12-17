# Deployment Guide - Production Checklist

## Pre-Deployment Requirements

### Accounts Required
- [ ] Webflow account (Pro plan for custom code)
- [ ] Supabase account (Free tier for MVP, Pro $25/mo recommended)
- [ ] SendGrid account (Free tier: 100 emails/day)
- [ ] Slack workspace (for team notifications)
- [ ] Domain name (e.g., yourcompany.com)

### Development Tools
- [ ] Git installed
- [ ] Node.js 18+ installed (for local testing)
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Code editor (VS Code recommended)

---

## Step 1: Supabase Setup (30 minutes)

### 1.1 Create Supabase Project

```bash
# Navigate to https://supabase.com/dashboard
1. Click "New Project"
2. Project Name: "lead-qualification-prod"
3. Database Password: [Generate strong password, save to password manager]
4. Region: Choose closest to your target customers
5. Wait 2 minutes for provisioning
```

### 1.2 Run Database Migration

```bash
# Clone this repository
git clone https://github.com/yourcompany/lead-qualification-saas.git
cd lead-qualification-saas

# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase db push

# Verify tables created
supabase db list
```

**Expected Output:**
```
✓ Tables created: users, leads, activities, notifications, analytics_snapshots
✓ Indexes created: 12 indexes
✓ Views created: hot_leads_queue, rep_performance
✓ Functions created: get_next_available_rep, assign_lead
```

### 1.3 Enable Row Level Security

```bash
# RLS is enabled in migration, verify:
supabase db inspect

# Should show:
# - leads: RLS enabled ✓
# - users: RLS enabled ✓
# - activities: RLS enabled ✓
```

### 1.4 Create Test Users

```sql
-- Run in Supabase SQL Editor
INSERT INTO users (full_name, email, role, slack_user_id) VALUES
  ('Test Manager', 'manager@yourcompany.com', 'manager', 'U12345'),
  ('Test Rep', 'rep@yourcompany.com', 'rep', 'U67890');

-- Create auth users (via Supabase Dashboard → Authentication → Add User)
```

### 1.5 Deploy Edge Functions

```bash
# Navigate to functions directory
cd backend/supabase/functions

# Deploy create-lead function
supabase functions deploy create-lead

# Deploy send-notification function
supabase functions deploy send-notification

# Verify deployment
supabase functions list
```

**Set Environment Variables:**
```bash
# In Supabase Dashboard → Edge Functions → Settings
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxx
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
supabase secrets set FROM_EMAIL=sales@yourcompany.com
supabase secrets set SALES_TEAM_EMAIL=sales@yourcompany.com
```

---

## Step 2: Webflow Setup (45 minutes)

### 2.1 Create Webflow Site

```bash
1. Go to Webflow Dashboard → New Site
2. Choose template: Start from scratch OR use "Contact" template
3. Site name: "Your Company Marketing Site"
4. Plan: CMS plan or higher (required for custom code)
```

### 2.2 Build Lead Capture Form Page

**Page: /get-demo**

1. **Add Form Element:**
   - Drag "Form Block" from Add Panel
   - Form Name: `lead-capture-form`
   - Action: Leave blank (handled by custom JS)

2. **Add Form Fields** (follow /webflow-config/form-design.md):
   - Text Input: contact_name (required)
   - Email Input: email (required)
   - Text Input: company_name (required)
   - Phone Input: phone
   - Select: company_size (required)
   - Select: industry (required)
   - Radio Buttons: inquiry_type (required)
   - Select: budget_timeline (required)
   - Text Input: current_solution
   - Textarea: message
   - Hidden Input: utm_source
   - Hidden Input: utm_medium
   - Hidden Input: utm_campaign

3. **Style Form** (see form-design.md for styling specs)

4. **Add Custom Code:**
   - Page Settings → Custom Code → Before </body>
   - Paste form submission JavaScript (see form-design.md)
   - Update API endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/create-lead`

### 2.3 Create Thank You Page

**Page: /thank-you**

1. Add success message
2. Add dynamic timeline script (see form-design.md)
3. Add resource links (demo video, case studies, pricing)

### 2.4 Build Sales Dashboard

**Page: /dashboard (Password Protected)**

1. **Enable Webflow Password Protection:**
   - Page Settings → Password Protection → Enable
   - OR use Webflow Memberships (paid plan)

2. **Add Custom Code:**
   - Copy `/webflow-config/dashboard-implementation.html`
   - Paste into Page Settings → Custom Code → Inside <body> tag
   - Update Supabase credentials:
     ```javascript
     const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'
     const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'
     ```

3. **Test Dashboard:**
   - Login with test user credentials
   - Verify leads load
   - Test status updates

---

## Step 3: Third-Party Integrations (20 minutes)

### 3.1 SendGrid Email Setup

```bash
1. Go to SendGrid Dashboard → Settings → API Keys
2. Create API Key: "Lead Qualification System"
3. Permissions: Full Access (or Mail Send only)
4. Copy API key → Add to Supabase secrets

# Verify sender identity
5. Settings → Sender Authentication
6. Verify email: sales@yourcompany.com
7. Complete domain authentication (SPF/DKIM)
```

**Test Email:**
```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_SENDGRID_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "sales@yourcompany.com"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Test successful"}]
  }'
```

### 3.2 Slack Webhook Setup

```bash
1. Go to Slack Workspace → Administration → Manage Apps
2. Search "Incoming Webhooks" → Add to Slack
3. Choose channel: #sales-hot-leads
4. Copy Webhook URL
5. Add to Supabase secrets: SLACK_WEBHOOK_URL
```

**Test Webhook:**
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "🔥 Test hot lead alert"}'
```

---

## Step 4: DNS & Domain Setup (15 minutes)

### 4.1 Connect Custom Domain to Webflow

```bash
1. Webflow Dashboard → Project Settings → Hosting → Custom Domains
2. Add domain: yourcompany.com
3. Copy DNS records (A records and CNAME)
4. Add records in your DNS provider (Cloudflare, Namecheap, etc.)
5. Wait 15-30 minutes for propagation
6. Enable SSL certificate in Webflow (automatic)
```

### 4.2 Verify HTTPS

```bash
# Test URL
curl -I https://yourcompany.com/get-demo

# Should return:
# HTTP/2 200
# Strict-Transport-Security: max-age=31536000
```

---

## Step 5: Testing Checklist (30 minutes)

### 5.1 Form Submission Test

**Hot Lead Test:**
```
1. Go to https://yourcompany.com/get-demo
2. Fill form with:
   - Company Size: 201-1000 employees
   - Industry: Software/SaaS
   - Inquiry Type: Demo Request
   - Timeline: Immediate
   - Corporate email
3. Submit form
4. Expected:
   ✓ Redirect to /thank-you with "within 1 hour" message
   ✓ Slack alert in #sales-hot-leads channel
   ✓ Email to sales@yourcompany.com
   ✓ Auto-response to customer email
   ✓ Lead appears in dashboard with score 80-100
```

**Warm Lead Test:**
```
- Score 50-79
- Expected:
  ✓ No Slack alert (correct)
  ✓ Lead in dashboard
  ✓ Auto-response email sent
```

**Cold Lead Test:**
```
- Score 0-49
- Expected:
  ✓ Lead saved but not assigned
  ✓ Nurture email sent
  ✓ No sales notification
```

### 5.2 Dashboard Test

```
1. Login to https://yourcompany.com/dashboard
2. Verify:
   ✓ Leads display correctly
   ✓ Filters work (Hot/Warm/Cold)
   ✓ Search works
   ✓ Status update works
   ✓ Real-time updates (submit new lead, see it appear)
```

### 5.3 Security Test

```
1. Try SQL injection in company name: "'; DROP TABLE leads; --"
   ✓ Should reject or sanitize
2. Try form submission from unauthorized origin
   ✓ Should block (CORS policy)
3. Try accessing dashboard without login
   ✓ Should redirect to login
```

---

## Step 6: Monitoring Setup (15 minutes)

### 6.1 Supabase Monitoring

```bash
1. Supabase Dashboard → Reports
2. Enable:
   - Database health monitoring
   - API usage tracking
   - Function execution logs

3. Set up alerts:
   - Edge Function error rate >5%
   - Database CPU >80%
   - API requests >10k/hour (DDoS detection)
```

### 6.2 External Monitoring (Optional)

**UptimeRobot (Free):**
```
1. Add monitor: https://yourcompany.com/get-demo
2. Check interval: 5 minutes
3. Alert email: ops@yourcompany.com
4. Add monitor: Supabase Edge Function health check
```

---

## Step 7: Go-Live Checklist

**Pre-Launch:**
- [ ] All environment variables set (SendGrid, Slack)
- [ ] Database migration completed
- [ ] Test users created and verified
- [ ] Form submission tested (Hot/Warm/Cold)
- [ ] Notifications tested (Slack, Email)
- [ ] Dashboard login tested
- [ ] Custom domain connected and SSL enabled
- [ ] Privacy policy published
- [ ] GDPR consent checkbox added to form

**Launch Day:**
- [ ] Remove Webflow password protection
- [ ] Update DNS to point to Webflow
- [ ] Send test lead submission
- [ ] Monitor Slack for hot lead alerts
- [ ] Check dashboard for real-time updates

**Post-Launch (Week 1):**
- [ ] Daily check: Notification delivery rate >95%
- [ ] Review spam leads, adjust detection
- [ ] Monitor average response time
- [ ] Collect feedback from sales team

---

## Rollback Plan

**If critical issue found post-launch:**

1. **Immediate:**
   - Revert DNS to previous site (or add "Under Maintenance" page)
   - Disable Edge Functions (prevent new lead processing)

2. **Investigate:**
   - Check Supabase logs: Dashboard → Logs → Edge Functions
   - Check Webflow form submissions
   - Check SendGrid delivery logs

3. **Fix & Redeploy:**
   - Fix code locally
   - Test in staging environment
   - Deploy fix to production
   - Re-enable functions

**Rollback Time Target:** <30 minutes

---

## Cost Estimate (Monthly)

| Service          | Tier         | Cost    | Notes                          |
|------------------|--------------|---------|--------------------------------|
| Supabase         | Pro          | $25     | 8GB database, 100GB egress     |
| Webflow          | CMS Plan     | $23     | Required for custom code       |
| SendGrid         | Free         | $0      | 100 emails/day (upgrade if needed) |
| Slack            | Free         | $0      | Incoming webhooks included     |
| Domain (yearly)  | —            | $1/mo   | Namecheap, Cloudflare          |
| **TOTAL**        |              | **$49/mo** | Scales to 1000 leads/month |

**At scale (5000 leads/month):**
- Supabase: $99/mo (Team plan)
- SendGrid: $15/mo (Essentials, 100k emails/mo)
- **Total: $137/mo**

---

## Maintenance Tasks

**Daily:**
- Check hot lead alert delivery (visual inspection in Slack)
- Review spam lead flags

**Weekly:**
- Review dashboard analytics
- Check avg response time metric
- Review scoring accuracy (do hot leads convert better?)

**Monthly:**
- Rotate API keys (security best practice)
- Review Supabase database size (if >7GB, upgrade plan)
- Export database backup to S3
- Review SendGrid deliverability report

**Quarterly:**
- Audit scoring formula (adjust based on conversion data)
- Review rep performance leaderboard
- Update privacy policy if data practices change

---

## Support Contacts

| Issue Type          | Contact                      | SLA         |
|---------------------|------------------------------|-------------|
| Webflow Down        | Webflow Status Page          | Check status|
| Supabase Down       | Supabase Status Page         | Check status|
| SendGrid Delivery   | SendGrid Support (paid tiers)| 24 hours    |
| Custom Code Bugs    | Internal dev team            | 4 hours     |

---

This deployment is **production-ready** and **scalable to 10k leads/month**.
