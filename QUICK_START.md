# Quick Start Guide

**Fast setup for developers familiar with the tech stack**

⏱️ **Time:** 30 minutes | 📚 **Full guide:** See [INSTALLATION.md](INSTALLATION.md)

---

## Prerequisites

```bash
# Required software
node --version  # v18+
git --version
deno --version  # For Edge Functions

# Install missing tools
npm install -g supabase
```

---

## 1. Accounts Setup (10 min)

### Supabase
```bash
# Create account: https://supabase.com
# Create project → Save credentials:
PROJECT_URL=https://xxxxx.supabase.co
ANON_KEY=eyJhbGci...
SERVICE_KEY=eyJhbGci...
PROJECT_REF=xxxxx
```

### SendGrid
```bash
# Create account: https://signup.sendgrid.com
# Verify sender email
# Create API key → Save:
SENDGRID_API_KEY=SG.xxxxx
```

### Slack
```bash
# Create webhook: https://api.slack.com/apps
# Select channel: #sales-hot-leads
# Save webhook URL:
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

---

## 2. Database Setup (5 min)

```bash
# Clone or navigate to project
cd lead-qualification-saas

# Login and link
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migration (creates 5 tables + seed data)
supabase db push

# Verify
supabase db list  # Should show: users, leads, activities, notifications, analytics_snapshots
```

---

## 3. Backend Deployment (5 min)

```bash
# Set environment variables in Supabase Dashboard
# Project Settings → Edge Functions → Secrets

# Add these 4 secrets:
SENDGRID_API_KEY=SG.xxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
FROM_EMAIL=sales@yourdomain.com
SALES_TEAM_EMAIL=sales@yourdomain.com

# Deploy functions
cd backend/supabase/functions
supabase functions deploy create-lead
supabase functions deploy send-notification

# Verify
supabase functions list
```

---

## 4. Test Backend (2 min)

```bash
# Create test file
cat > test.json << 'EOF'
{
  "contact_name": "Test User",
  "email": "test@acme.com",
  "company_name": "Acme Corp",
  "company_size": "201-1000",
  "industry": "Software/SaaS",
  "inquiry_type": "Demo Request",
  "budget_timeline": "Immediate"
}
EOF

# Test API
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-lead" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  --data @test.json

# Expected: {"success":true,"score":95,"category":"Hot",...}
# Check: Slack alert + Email sent + Lead in database
```

---

## 5. Webflow Setup (8 min)

### Create Pages

**Page 1: Form** (`/get-demo`)
1. Add Form Block with 10 fields (see `webflow-config/form-design.md`)
2. Add custom code in Page Settings → Before </body>:

```javascript
<script>
// UTM tracking
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(field => {
    const input = document.querySelector(`[name="${field}"]`);
    if (input) input.value = urlParams.get(field) || '';
  });
});

// Form submission
document.querySelector('form').addEventListener('submit', async function(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));

  try {
    const submitBtn = event.target.querySelector('input[type="submit"]');
    submitBtn.value = 'Submitting...';
    submitBtn.disabled = true;

    const response = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      window.location.href = `/thank-you?score=${result.score}`;
    } else {
      throw new Error('Submission failed');
    }
  } catch (error) {
    alert('Error. Please try again.');
    const submitBtn = event.target.querySelector('input[type="submit"]');
    submitBtn.value = 'Get Your Demo';
    submitBtn.disabled = false;
  }
});
</script>
```

**⚠️ Replace YOUR_PROJECT_REF and YOUR_ANON_KEY**

**Page 2: Thank You** (`/thank-you`)
- Add heading + dynamic timeline script (see `webflow-config/form-design.md`)

**Page 3: Dashboard** (`/dashboard` - password protected)
- Copy entire content from `webflow-config/dashboard-implementation.html`
- Update SUPABASE_URL and SUPABASE_ANON_KEY

### Publish
```bash
# In Webflow Designer
Click "Publish" → Publish to webflow.io
# Your URL: https://your-site.webflow.io
```

---

## 6. End-to-End Test (5 min)

### Test Hot Lead
1. Go to `https://your-site.webflow.io/get-demo`
2. Fill form:
   - Company Size: 201-1000
   - Industry: Software/SaaS
   - Inquiry: Demo Request
   - Timeline: Immediate
   - Use corporate email
3. Submit

**Expected:**
- ✅ Redirect to thank-you (within 1 hour)
- ✅ Slack alert in #sales-hot-leads
- ✅ Email to sales team
- ✅ Auto-response to customer
- ✅ Lead in dashboard with score ~95

### Test Dashboard
1. Go to `https://your-site.webflow.io/dashboard`
2. Enter password
3. Verify:
   - Lead appears with Hot badge
   - Filters work
   - Status update works
   - Real-time updates (submit another lead, see it appear)

---

## Common Issues

### Form returns 500 error
```bash
# Check function logs
supabase functions logs create-lead

# Verify environment variables
# Supabase Dashboard → Edge Functions → Secrets
```

### No Slack notification
```bash
# Test webhook directly
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test"}'

# Check logs
supabase functions logs send-notification
```

### Dashboard shows "Loading..."
```javascript
// Check browser console (F12)
// Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
// Test connection:
const { data, error } = await supabase.from('leads').select('*').limit(1);
console.log(data, error);
```

---

## Project Structure

```
lead-qualification-saas/
├── backend/supabase/
│   ├── migrations/001_initial_schema.sql  ← Database schema
│   └── functions/
│       ├── create-lead/index.ts           ← Form submission + scoring
│       └── send-notification/index.ts     ← Alerts
├── webflow-config/
│   ├── form-design.md                     ← Form specification
│   └── dashboard-implementation.html      ← Dashboard code
├── docs/
│   ├── 01-business-analysis.md            ← Problem + personas
│   ├── 02-lead-scoring-engine.md          ← Scoring formulas
│   └── ... (6 docs total)
├── INSTALLATION.md                        ← Detailed setup guide
└── README.md                              ← Project overview
```

---

## Key URLs

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference:

```
Supabase Dashboard:
https://supabase.com/dashboard/project/YOUR_PROJECT_REF

Database Tables:
https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor

Edge Functions:
https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-lead
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification

Your Site:
https://your-site-name.webflow.io/get-demo (form)
https://your-site-name.webflow.io/dashboard (dashboard)
```

---

## Essential Commands

```bash
# Deploy function changes
cd backend/supabase/functions
supabase functions deploy create-lead

# View logs
supabase functions logs create-lead --follow

# Database queries
supabase db shell
# Then run SQL:
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;

# Test API
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-lead" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact_name":"Test","email":"test@test.com","company_name":"Test","company_size":"51-200","industry":"Software/SaaS","inquiry_type":"Demo Request","budget_timeline":"Immediate"}'
```

---

## Next Steps

✅ **Customize:**
- Update branding in Webflow
- Adjust scoring weights in `create-lead/index.ts`
- Customize email templates in `send-notification/index.ts`

✅ **Add custom domain:**
- Upgrade Webflow plan
- Point DNS to Webflow
- Update URLs in code

✅ **Set up monitoring:**
- UptimeRobot for uptime monitoring
- Supabase alerts for errors
- SendGrid for email delivery tracking

✅ **Production checklist:**
- [ ] Replace test users with real sales reps
- [ ] Set up proper dashboard authentication (Supabase Auth)
- [ ] Enable SSL (automatic with Webflow)
- [ ] Add privacy policy
- [ ] Configure GDPR consent (if EU)
- [ ] Set up database backups

---

## Documentation

📚 **Full installation guide:** [INSTALLATION.md](INSTALLATION.md)
📖 **Business documentation:** `docs/01-business-analysis.md`
🔧 **Technical specs:** `docs/02-lead-scoring-engine.md`
🎨 **Portfolio guide:** `portfolio/presentation-guide.md`

---

**Setup complete? Test the system then customize for your use case!**

**Having issues?** Check [INSTALLATION.md](INSTALLATION.md) troubleshooting section.
