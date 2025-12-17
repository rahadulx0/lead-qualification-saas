# Installation Guide - Lead Qualification Platform

**Complete step-by-step instructions to run this project from scratch**

**Time Required:** 2-3 hours (including account creation and testing)

**Difficulty:** Intermediate (requires basic command line knowledge)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Account Setup](#account-setup)
3. [Local Environment Setup](#local-environment-setup)
4. [Database Setup (Supabase)](#database-setup-supabase)
5. [Backend Setup (Edge Functions)](#backend-setup-edge-functions)
6. [Third-Party Integrations](#third-party-integrations)
7. [Frontend Setup (Webflow)](#frontend-setup-webflow)
8. [Testing the Complete System](#testing-the-complete-system)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## Prerequisites

### Required Knowledge
- [ ] Basic command line / terminal usage
- [ ] Basic understanding of environment variables
- [ ] Basic HTML/CSS/JavaScript (for Webflow customization)
- [ ] SQL basics (optional but helpful)

### Required Software

#### 1. Node.js (Version 18 or higher)

**Check if installed:**
```bash
node --version
```

**If not installed or version < 18:**
- **Mac:**
  ```bash
  # Using Homebrew
  brew install node

  # OR download from nodejs.org
  ```
- **Windows:**
  - Download installer from https://nodejs.org/
  - Choose "LTS" version
  - Run installer, accept defaults
- **Linux:**
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

**Verify installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### 2. Git

**Check if installed:**
```bash
git --version
```

**If not installed:**
- **Mac:**
  ```bash
  brew install git
  ```
- **Windows:** Download from https://git-scm.com/download/win
- **Linux:**
  ```bash
  sudo apt-get install git
  ```

#### 3. Code Editor (Recommended: VS Code)

- Download from https://code.visualstudio.com/
- Install recommended extensions:
  - PostgreSQL (by Chris Kolkman)
  - Deno (for Supabase Edge Functions)
  - Thunder Client (for API testing)

---

## Account Setup

### 1. Supabase Account (Free Tier)

**Step 1: Create Account**
1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify email if using email signup

**Step 2: Create Project**
1. Click "New Project"
2. Fill in:
   - **Project Name:** `lead-qualification-prod`
   - **Database Password:** Generate strong password (save in password manager)
   - **Region:** Choose closest to your location
     - US East (recommended for US)
     - EU West (for Europe)
     - AP Southeast (for Asia/Australia)
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning (you'll see a progress bar)

**Step 3: Save Project Credentials**

Once project is created, go to **Project Settings → API**

Copy and save these values (you'll need them later):
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
Project API Key (anon, public): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Project API Key (service_role, secret): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Project Reference ID: xxxxxxxxxxxxx
```

**⚠️ IMPORTANT:**
- Never share `service_role` key publicly (has admin access)
- `anon` key is safe for frontend use (has limited permissions)

---

### 2. SendGrid Account (Free Tier - 100 emails/day)

**Step 1: Create Account**
1. Go to https://signup.sendgrid.com/
2. Sign up with email
3. Fill in company details (can use personal for testing)
4. Verify email address

**Step 2: Complete Sender Authentication**
1. Go to **Settings → Sender Authentication**
2. Click "Verify a Single Sender"
3. Fill in:
   - **From Name:** Your Company Sales Team
   - **From Email:** sales@yourdomain.com (use a real email you control)
   - **Reply To:** Same as From Email
   - **Company Address:** Your address
4. Click "Create"
5. Check your email for verification link
6. Click verification link

**Step 3: Create API Key**
1. Go to **Settings → API Keys**
2. Click "Create API Key"
3. Name: `Lead Qualification System`
4. Permissions: **Full Access** (or "Mail Send" if restricted access preferred)
5. Click "Create & View"
6. **Copy the API key immediately** (you can't see it again)
7. Save in password manager

Example API key format:
```
SG.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

### 3. Slack Workspace Setup

**Option A: Use Existing Workspace**

**Option B: Create New Workspace (for testing)**
1. Go to https://slack.com/create
2. Enter email
3. Check email for verification code
4. Enter code
5. Create workspace name: `Lead Qualification Test`
6. Create channel: `#sales-hot-leads`

**Step: Create Incoming Webhook**
1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. App Name: `Lead Alerts`
5. Workspace: Choose your workspace
6. Click "Create App"
7. In left sidebar, click "Incoming Webhooks"
8. Toggle "Activate Incoming Webhooks" to **On**
9. Scroll down, click "Add New Webhook to Workspace"
10. Select channel: `#sales-hot-leads`
11. Click "Allow"
12. **Copy webhook URL** (looks like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`)
13. Save in password manager

**Test Webhook:**
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "🔥 Test alert from Lead Qualification System!"}'
```

You should see the message appear in your #sales-hot-leads channel.

---

### 4. Webflow Account

**Step 1: Create Account**
1. Go to https://webflow.com/
2. Click "Get started for free"
3. Sign up with email or Google
4. Choose plan:
   - **Free plan:** For testing (has Webflow branding)
   - **Basic plan ($14/mo):** Remove branding
   - **CMS plan ($23/mo):** Required for custom code in production

**Step 2: Create Site**
1. Click "Create Site"
2. Choose "Start from scratch" (blank canvas)
3. Site name: `Lead Qualification Demo`
4. Click "Create Site"

---

## Local Environment Setup

### 1. Clone Repository

**Option A: Clone from GitHub (if you forked the repo)**
```bash
cd ~/Code  # Or wherever you keep projects
git clone https://github.com/YOUR_USERNAME/lead-qualification-saas.git
cd lead-qualification-saas
```

**Option B: Use the existing directory**
```bash
cd /Users/rahadul/Code/webflow/lead-qualification-saas
```

### 2. Install Supabase CLI

**Mac/Linux:**
```bash
npm install -g supabase
```

**Windows:**
```bash
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
# Should show: supabase 1.x.x
```

### 3. Install Deno (Required for Edge Functions)

**Mac/Linux:**
```bash
curl -fsSL https://deno.land/install.sh | sh
```

**Windows (PowerShell):**
```bash
irm https://deno.land/install.ps1 | iex
```

**Add to PATH (Mac/Linux):**
```bash
# Add to ~/.zshrc or ~/.bashrc
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Verify installation:**
```bash
deno --version
# Should show: deno 1.x.x
```

---

## Database Setup (Supabase)

### 1. Link Local Project to Supabase

```bash
cd /Users/rahadul/Code/webflow/lead-qualification-saas

# Login to Supabase
supabase login

# This will open browser for authentication
# Click "Authorize" to grant access
```

**You should see:**
```
Finished supabase login.
```

**Link to your project:**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with the reference ID from Supabase dashboard (Settings → General → Reference ID)

Example:
```bash
supabase link --project-ref xyzabcdefghijk
```

**Enter database password when prompted** (the one you created when setting up Supabase)

**You should see:**
```
Finished supabase link.
```

### 2. Run Database Migration

**View the migration file (optional):**
```bash
cat backend/supabase/migrations/001_initial_schema.sql
```

This file creates:
- 5 tables: `users`, `leads`, `activities`, `notifications`, `analytics_snapshots`
- 12 indexes for performance
- Row Level Security policies
- Views and functions
- Seed data (3 test users)

**Push migration to Supabase:**
```bash
supabase db push
```

**You should see:**
```
Applying migration 001_initial_schema.sql...
Finished supabase db push.
```

**⚠️ If you see errors:**
- Check database password is correct
- Ensure you're linked to correct project
- Check migration file for syntax errors

### 3. Verify Database Setup

**Option A: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Open your project
3. Click "Table Editor" in left sidebar
4. You should see 5 tables:
   - `users`
   - `leads`
   - `activities`
   - `notifications`
   - `analytics_snapshots`

**Option B: Using Supabase CLI**
```bash
supabase db list
```

You should see all 5 tables listed.

### 4. Verify Seed Data

**Check test users were created:**
1. In Supabase Dashboard → Table Editor
2. Click on `users` table
3. You should see 3 rows:
   - Marcus Johnson (rep)
   - Sarah Chen (manager)
   - Alex Rodriguez (rep)

**Using SQL Editor:**
1. Go to SQL Editor in Supabase dashboard
2. Run:
   ```sql
   SELECT full_name, email, role FROM users;
   ```
3. Should return 3 users

---

## Backend Setup (Edge Functions)

### 1. Set Environment Variables

**Go to Supabase Dashboard:**
1. Project Settings → Edge Functions
2. Scroll to "Secrets"

**Add these secrets one by one:**

Click "Add new secret":

| Secret Name              | Value                                    | Where to get it              |
|--------------------------|------------------------------------------|------------------------------|
| `SENDGRID_API_KEY`       | `SG.xxxxxx...`                          | From SendGrid setup above    |
| `SLACK_WEBHOOK_URL`      | `https://hooks.slack.com/services/...`  | From Slack setup above       |
| `FROM_EMAIL`             | `sales@yourdomain.com`                  | Your verified SendGrid email |
| `SALES_TEAM_EMAIL`       | `sales@yourdomain.com`                  | Your email for alerts        |

**Example:**
```
Secret Name: SENDGRID_API_KEY
Secret Value: SG.abc123def456...
[Add Secret]
```

**⚠️ Common Mistakes:**
- Don't include quotes around values
- Don't include spaces before/after values
- Make sure SLACK_WEBHOOK_URL starts with `https://`

### 2. Deploy Edge Functions

**Navigate to functions directory:**
```bash
cd backend/supabase/functions
```

**Deploy create-lead function:**
```bash
supabase functions deploy create-lead
```

**You should see:**
```
Deploying create-lead (project ref: xxxxx)...
Bundling create-lead...
Deploying create-lead...
Deployed create-lead to https://xxxxx.supabase.co/functions/v1/create-lead
```

**Deploy send-notification function:**
```bash
supabase functions deploy send-notification
```

**You should see:**
```
Deploying send-notification...
Deployed send-notification to https://xxxxx.supabase.co/functions/v1/send-notification
```

### 3. Verify Functions Deployed

**Using Supabase CLI:**
```bash
supabase functions list
```

**Expected output:**
```
create-lead         deployed  https://xxxxx.supabase.co/functions/v1/create-lead
send-notification   deployed  https://xxxxx.supabase.co/functions/v1/send-notification
```

**Using Dashboard:**
1. Go to Edge Functions in Supabase dashboard
2. You should see both functions listed

### 4. Test Edge Functions

**Test create-lead function:**

Create a test file `test-lead.json`:
```bash
cat > test-lead.json << 'EOF'
{
  "contact_name": "John Doe",
  "email": "john@acme-corp.com",
  "company_name": "Acme Corp",
  "phone": "+1-555-0100",
  "company_size": "201-1000",
  "industry": "Software/SaaS",
  "inquiry_type": "Demo Request",
  "budget_timeline": "Immediate",
  "current_solution": "Competitor X",
  "message": "Interested in demo"
}
EOF
```

**Send test request:**
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-lead" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  --data @test-lead.json
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your anon key from Supabase dashboard

**Expected response:**
```json
{
  "success": true,
  "lead_id": "uuid-here",
  "score": 95,
  "category": "Hot",
  "message": "Thank you! Your request has been received."
}
```

**Check results:**
1. Go to Supabase Dashboard → Table Editor → `leads`
2. You should see the new lead with score 95
3. Check Slack channel - should have received hot lead alert
4. Check your email - should have received alert

**⚠️ If test fails:**
- Check function logs: Supabase Dashboard → Edge Functions → Logs
- Verify environment variables are set correctly
- Check SendGrid and Slack credentials

---

## Third-Party Integrations

### 1. Verify SendGrid Integration

**Send test email via SendGrid:**
```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer YOUR_SENDGRID_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "personalizations": [
      {
        "to": [{"email": "YOUR_EMAIL@example.com"}],
        "subject": "Test from Lead Qualification System"
      }
    ],
    "from": {"email": "sales@yourdomain.com", "name": "Sales Team"},
    "content": [
      {
        "type": "text/plain",
        "value": "If you receive this, SendGrid is working!"
      }
    ]
  }'
```

**Check your email** - should receive test email within 1 minute.

**⚠️ If email not received:**
- Check spam folder
- Verify sender email is verified in SendGrid
- Check SendGrid Activity Feed: Dashboard → Email Activity

### 2. Verify Slack Integration

**Already tested in Account Setup section, but test again:**
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "✅ Slack integration verified!"}'
```

**Check #sales-hot-leads channel** - message should appear instantly.

---

## Frontend Setup (Webflow)

### 1. Build Lead Capture Form

**Create Form Page:**
1. Open Webflow Designer for your site
2. Click "+" to add new page
3. Page name: `get-demo`
4. URL slug: `/get-demo`
5. Click "Create Page"

**Add Form Element:**
1. Click "+" in left toolbar
2. Drag "Form Block" onto page
3. Click on form, set name: `lead-capture-form`

**Add Form Fields (one by one):**

Reference: `webflow-config/form-design.md` for complete specifications

**Field 1: Contact Name**
1. Drag "Text Input" into form
2. Settings:
   - Name: `contact_name`
   - Placeholder: `John Doe`
   - Required: ✓

**Field 2: Email**
1. Drag "Email Input" into form
2. Settings:
   - Name: `email`
   - Placeholder: `john@company.com`
   - Required: ✓

**Field 3: Company Name**
1. Drag "Text Input" into form
2. Settings:
   - Name: `company_name`
   - Placeholder: `Acme Corp`
   - Required: ✓

**Field 4: Phone**
1. Drag "Phone Input" into form
2. Settings:
   - Name: `phone`
   - Placeholder: `+1 (555) 123-4567`
   - Required: ✗

**Field 5: Company Size**
1. Drag "Select" dropdown into form
2. Settings:
   - Name: `company_size`
   - Options:
     - `Select company size` (value: ``, disabled)
     - `1-10 employees` (value: `1-10`)
     - `11-50 employees` (value: `11-50`)
     - `51-200 employees` (value: `51-200`)
     - `201-1000 employees` (value: `201-1000`)
     - `1000+ employees` (value: `1000+`)
   - Required: ✓

**Field 6: Industry**
1. Drag "Select" dropdown into form
2. Settings:
   - Name: `industry`
   - Options:
     - `Select industry` (value: ``, disabled)
     - `Software/SaaS` (value: `Software/SaaS`)
     - `Marketing/Advertising` (value: `Marketing/Advertising`)
     - `Financial Services` (value: `Financial Services`)
     - `Healthcare` (value: `Healthcare`)
     - `Professional Services` (value: `Professional Services`)
     - `Manufacturing` (value: `Manufacturing`)
     - `Retail/E-commerce` (value: `Retail/E-commerce`)
     - `Education` (value: `Education`)
     - `Non-Profit` (value: `Non-Profit`)
     - `Other` (value: `Other`)
   - Required: ✓

**Field 7: Inquiry Type (Radio Buttons)**
1. Drag "Radio Buttons" into form
2. Settings:
   - Name: `inquiry_type`
   - Options:
     - `Request a demo` (value: `Demo Request`) - Default selected
     - `Get pricing information` (value: `Pricing Information`)
     - `Talk to sales` (value: `Contact Sales`)
     - `General question` (value: `General Question`)
     - `Download resources` (value: `Content Download`)
   - Required: ✓

**Field 8: Budget Timeline**
1. Drag "Select" dropdown into form
2. Settings:
   - Name: `budget_timeline`
   - Options:
     - `Select timeline` (value: ``, disabled)
     - `Immediately (within 1 month)` (value: `Immediate`)
     - `1-3 months` (value: `1-3 months`)
     - `3-6 months` (value: `3-6 months`)
     - `6-12 months` (value: `6-12 months`)
     - `Just researching` (value: `Just Researching`)
   - Required: ✓

**Field 9: Current Solution**
1. Drag "Text Input" into form
2. Settings:
   - Name: `current_solution`
   - Placeholder: `Currently using [Competitor Name]`
   - Required: ✗

**Field 10: Message**
1. Drag "Text Area" into form
2. Settings:
   - Name: `message`
   - Placeholder: `Tell us about your needs...`
   - Rows: 4
   - Required: ✗

**Hidden Fields (UTM tracking):**
1. Drag "Hidden Input" into form (3 times)
2. Names: `utm_source`, `utm_medium`, `utm_campaign`

**Submit Button:**
1. Click on submit button
2. Change text to: "Get Your Demo"

### 2. Add Custom JavaScript

**In Page Settings:**
1. Click page settings icon (top left)
2. Scroll to "Custom Code"
3. In "Before </body> tag" section, paste:

```html
<script>
// Populate UTM parameters
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);

  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign'];
  utmFields.forEach(field => {
    const input = document.querySelector(`[name="${field}"]`);
    if (input) {
      input.value = urlParams.get(field) || '';
    }
  });
});

// Form submission handling
document.querySelector('form').addEventListener('submit', async function(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

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
    console.error('Form submission error:', error);
    alert('We encountered an issue. Please try again.');

    const submitBtn = event.target.querySelector('input[type="submit"]');
    submitBtn.value = 'Get Your Demo';
    submitBtn.disabled = false;
  }
});
</script>
```

**⚠️ IMPORTANT: Replace these values:**
- `YOUR_PROJECT_REF` → Your Supabase project reference
- `YOUR_ANON_KEY` → Your Supabase anon key

### 3. Create Thank You Page

**Create Page:**
1. Add new page: `thank-you`
2. URL slug: `/thank-you`

**Add Content:**
1. Add heading: "Thank You!"
2. Add text: "We received your demo request."
3. Add HTML Embed with ID "timeline":

```html
<div id="timeline" style="font-size: 18px; margin: 20px 0;"></div>

<script>
  const score = new URLSearchParams(window.location.search).get('score') || 50;
  let timeline;

  if (score >= 80) {
    timeline = "within 1 hour";
  } else if (score >= 50) {
    timeline = "within 24 hours";
  } else {
    timeline = "this week";
  }

  document.querySelector('#timeline').innerHTML =
    `A team member will reach out <strong>${timeline}</strong>.`;
</script>
```

### 4. Build Sales Dashboard

**Create Password-Protected Page:**
1. Add new page: `dashboard`
2. URL slug: `/dashboard`
3. Page Settings → Password Protection → Enable
4. Set password: `demo123` (change for production)

**Add Dashboard HTML:**
1. Delete all default elements
2. Drag "HTML Embed" to fill entire page
3. Open `webflow-config/dashboard-implementation.html`
4. Copy entire contents
5. Paste into HTML Embed

**Update Supabase Credentials:**

Find these lines in the code:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'
```

Replace with your actual values:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_ANON_KEY'
```

### 5. Publish Webflow Site

1. Click "Publish" button (top right)
2. Choose "Publish to webflow.io" (free subdomain)
3. Your site URL: `your-site-name.webflow.io`
4. Click "Publish to Selected Domains"

**Wait 30 seconds for deployment**

---

## Testing the Complete System

### Test 1: Hot Lead Submission

**Step 1: Submit form with hot lead data**

Go to: `https://your-site-name.webflow.io/get-demo`

Fill in:
- **Contact Name:** Jane Smith
- **Email:** jane@bigcorp.com
- **Company Name:** BigCorp Inc
- **Phone:** +1-555-0200
- **Company Size:** 201-1000 employees
- **Industry:** Software/SaaS
- **Inquiry Type:** Request a demo (selected)
- **Budget Timeline:** Immediately
- **Current Solution:** None
- **Message:** Looking for demo next week

Click "Get Your Demo"

**Expected Results:**

✅ **Within 3 seconds:**
1. Redirected to thank-you page showing "within 1 hour"
2. Slack notification in #sales-hot-leads channel with lead details
3. Email alert sent to sales@yourdomain.com
4. Auto-response email sent to jane@bigcorp.com

✅ **In Dashboard:**
1. Go to `https://your-site-name.webflow.io/dashboard`
2. Enter password: `demo123`
3. Should see lead with score 95, category "Hot"

✅ **In Database:**
1. Supabase Dashboard → Table Editor → `leads`
2. Should see new row with all data

**If any step fails, see [Troubleshooting](#troubleshooting) section**

---

### Test 2: Warm Lead Submission

Submit form with:
- Company Size: 11-50 employees (10 pts)
- Industry: Marketing/Advertising (18 pts)
- Inquiry Type: Get pricing information (25 pts)
- Timeline: 1-3 months (15 pts)
- Corporate email (5 pts)

**Expected Score:** 73 points (Warm)

**Expected Results:**
✅ Redirected to thank-you showing "within 24 hours"
✅ NO Slack alert (correct behavior)
✅ Lead appears in dashboard with "Warm" badge
✅ Auto-response email sent

---

### Test 3: Cold Lead Submission

Submit form with:
- Company Size: 1-10 employees (5 pts)
- Industry: Education (5 pts)
- Inquiry Type: Download resources (5 pts)
- Timeline: Just researching (0 pts)
- Free email (0 pts)

**Expected Score:** 15 points (Cold)

**Expected Results:**
✅ Redirected to thank-you showing "this week"
✅ NO Slack alert (correct)
✅ Lead in dashboard with "Cold" badge
✅ Nurture email sent

---

### Test 4: Dashboard Functionality

**Test Filters:**
1. Go to dashboard
2. Filter by "Hot" category → Should show only hot leads
3. Filter by "Warm" → Should show warm leads
4. Search for "BigCorp" → Should filter to that company

**Test Status Update:**
1. Click "Update" on a lead
2. Change status to "Contacted"
3. Click "Update"
4. Status should change immediately

**Test Real-Time Updates:**
1. Keep dashboard open in browser
2. Submit new lead via form
3. Dashboard should update automatically (within 5 seconds)

---

### Test 5: Email & Slack Delivery

**Check Email Delivery:**
1. Go to SendGrid Dashboard → Email Activity
2. Should see 3 emails sent (hot lead alert, auto-response, etc.)
3. Status should be "Delivered"

**Check Slack Messages:**
1. Go to #sales-hot-leads channel
2. Should see hot lead alerts
3. Click "View in Dashboard" link (update URL first in code)

**Check Email Content:**
1. Open auto-response email
2. Verify company name is personalized
3. Verify timeline is correct ("within 1 hour" for hot leads)

---

## Troubleshooting

### Issue 1: Form Submission Returns 500 Error

**Symptoms:**
- Form shows "We encountered an issue" alert
- No lead created in database
- No notifications sent

**Solutions:**

**Check 1: Verify Edge Function is deployed**
```bash
supabase functions list
```
Should show `create-lead` as "deployed"

**Check 2: Check function logs**
```bash
supabase functions logs create-lead
```
Look for error messages

**Check 3: Verify environment variables**
1. Supabase Dashboard → Edge Functions → Secrets
2. Ensure all 4 secrets are set

**Check 4: Test function directly**
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-lead" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"contact_name":"Test","email":"test@test.com","company_name":"Test Co","company_size":"11-50","industry":"Software/SaaS","inquiry_type":"Demo Request","budget_timeline":"Immediate"}'
```

If this works but form doesn't, issue is in Webflow JavaScript.

---

### Issue 2: No Slack Notification Received

**Check 1: Verify webhook URL is correct**
1. Go to Supabase → Edge Functions → Secrets
2. Check `SLACK_WEBHOOK_URL` value
3. Should start with `https://hooks.slack.com/services/`

**Check 2: Test webhook directly**
```bash
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test"}'
```

If message appears, webhook is correct. Issue is in Edge Function.

**Check 3: Check function logs**
```bash
supabase functions logs send-notification
```

Look for errors like "Slack API error"

**Check 4: Verify lead is actually Hot**
- Go to Supabase → Table Editor → leads
- Check `category` column
- Only "Hot" leads trigger Slack alerts

---

### Issue 3: No Email Received

**Check 1: Check spam folder**

**Check 2: Verify SendGrid API key**
1. Test SendGrid separately (see Third-Party Integrations section)
2. If test works, issue is in Edge Function

**Check 3: Check SendGrid Activity**
1. SendGrid Dashboard → Email Activity
2. Search for recipient email
3. Check status: "Delivered", "Bounce", "Spam Report"

**Check 4: Verify sender email is verified**
1. SendGrid → Settings → Sender Authentication
2. Email must have green checkmark

**Check 5: Check Edge Function logs**
```bash
supabase functions logs send-notification
```

---

### Issue 4: Dashboard Shows "Loading..." Forever

**Check 1: Verify Supabase credentials in code**
1. Go to Webflow Designer → dashboard page
2. Open HTML Embed
3. Find lines:
   ```javascript
   const SUPABASE_URL = '...'
   const SUPABASE_ANON_KEY = '...'
   ```
4. Verify these match your Supabase dashboard values

**Check 2: Check browser console for errors**
1. Open dashboard page
2. Press F12 (Windows) or Cmd+Option+I (Mac)
3. Go to "Console" tab
4. Look for errors (red text)

Common errors:
- `Failed to fetch` → CORS issue or wrong URL
- `Invalid API key` → Wrong anon key
- `RLS policy violation` → Row Level Security blocking query

**Check 3: Test Supabase connection directly**

Open browser console on dashboard page, run:
```javascript
const supabase = window.supabase.createClient(
  'https://YOUR_PROJECT_REF.supabase.co',
  'YOUR_ANON_KEY'
);

const { data, error } = await supabase.from('leads').select('*').limit(5);
console.log('Data:', data, 'Error:', error);
```

If error is "RLS policy violation", Row Level Security is blocking query.

**Fix RLS issue:**
```sql
-- Run in Supabase SQL Editor
-- Temporarily disable RLS for testing
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** This disables security. Only for local testing. Re-enable before production:
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

---

### Issue 5: "Duplicate submission" Error

**Cause:** The database has a unique constraint preventing same email from submitting twice in 24 hours.

**Solution (for testing):**
1. Use different email addresses for each test
2. OR delete test leads from database:
   ```sql
   -- In Supabase SQL Editor
   DELETE FROM leads WHERE email = 'test@test.com';
   ```

---

### Issue 6: Edge Function Times Out

**Symptoms:**
- Form submission takes >30 seconds
- Returns 504 Gateway Timeout

**Causes:**
1. SendGrid API is slow/down
2. Slack webhook is slow/down
3. Database query is slow

**Solutions:**

**Check 1: Test without notifications**

Comment out notification call in `create-lead/index.ts`:
```typescript
// Temporarily disable notifications for testing
/*
if (scoreResult.category === 'Hot') {
  await fetch(...); // Notification call
}
*/
```

Redeploy:
```bash
supabase functions deploy create-lead
```

If form now works, issue is with notifications.

**Check 2: Check database performance**
```sql
-- In Supabase SQL Editor
EXPLAIN ANALYZE
SELECT * FROM leads
WHERE category = 'Hot'
ORDER BY lead_score DESC
LIMIT 50;
```

Query should take <100ms. If slower, indexes may be missing.

---

### Issue 7: CORS Error in Browser Console

**Error Message:**
```
Access to fetch at 'https://xxx.supabase.co/functions/v1/create-lead'
from origin 'https://your-site.webflow.io' has been blocked by CORS policy
```

**Cause:** Edge Function needs to allow requests from Webflow domain.

**Solution:**

Edit `create-lead/index.ts`:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins
  // OR restrict to your domain:
  // 'Access-Control-Allow-Origin': 'https://your-site.webflow.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Redeploy:
```bash
supabase functions deploy create-lead
```

---

## Next Steps

### 1. Customize for Your Use Case

**Update Branding:**
- Change "Your Company" to your actual company name
- Update logo in Webflow
- Customize email templates in `send-notification/index.ts`
- Update Slack message format

**Adjust Scoring Formula:**
- Edit weights in `create-lead/index.ts`
- Test with different values
- Monitor conversion rates to validate scoring accuracy

**Add Custom Fields:**
- Add fields to Webflow form
- Update database schema (add migration)
- Update scoring logic to include new fields

### 2. Add Custom Domain

**In Webflow:**
1. Upgrade to paid plan
2. Go to Project Settings → Hosting → Custom Domains
3. Add your domain (e.g., `www.yourcompany.com`)
4. Update DNS records at your domain registrar
5. Wait 24-48 hours for propagation

**Update all URLs:**
- Form submission endpoint
- Dashboard link in Slack messages
- Email links

### 3. Create Authentication for Dashboard

**Current:** Dashboard uses password protection (everyone uses same password)

**Production:** Use Supabase Auth for individual logins

**Implementation:**
1. Create login page in Webflow
2. Use Supabase Auth JavaScript library
3. Check user is authenticated before showing dashboard
4. Use Row Level Security to show only assigned leads

See: https://supabase.com/docs/guides/auth

### 4. Set Up Monitoring

**Application Monitoring:**
1. Sign up for Sentry (free tier)
2. Add Sentry SDK to Edge Functions
3. Get alerts when errors occur

**Uptime Monitoring:**
1. Sign up for UptimeRobot (free)
2. Monitor: Form page, dashboard, Edge Functions
3. Get alerts if site goes down

**Performance Monitoring:**
1. Set up Supabase alerts: Dashboard → Project Settings → Alerts
2. Alert when database CPU >80%
3. Alert when API requests >10k/hour

### 5. Add More Test Data

**Generate sample leads:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO leads (
  company_name, contact_name, email, company_size, industry,
  inquiry_type, budget_timeline, lead_score, category, status
) VALUES
  ('Startup Inc', 'Alice Johnson', 'alice@startup.com', '11-50', 'Software/SaaS',
   'Demo Request', 'Immediate', 88, 'Hot', 'New'),
  ('MidCorp LLC', 'Bob Smith', 'bob@midcorp.com', '51-200', 'Marketing/Advertising',
   'Pricing Information', '1-3 months', 73, 'Warm', 'New'),
  ('Small Biz', 'Carol White', 'carol@smallbiz.com', '1-10', 'Education',
   'Content Download', 'Just Researching', 18, 'Cold', 'New');
```

Refresh dashboard to see new leads.

### 6. Enable Real Production Features

**Before going live:**
- [ ] Remove test users from database
- [ ] Update dashboard password (or implement proper auth)
- [ ] Add real sales rep users
- [ ] Configure proper email domain (not @gmail)
- [ ] Set up email domain authentication (SPF, DKIM)
- [ ] Add privacy policy page
- [ ] Add terms of service
- [ ] Enable HTTPS (automatic with Webflow)
- [ ] Configure GDPR consent (if EU customers)
- [ ] Set up database backups
- [ ] Configure alerts and monitoring

---

## Common Commands Reference

### Supabase CLI

```bash
# Login
supabase login

# Link project
supabase link --project-ref YOUR_REF

# Push database changes
supabase db push

# List Edge Functions
supabase functions list

# Deploy function
supabase functions deploy FUNCTION_NAME

# View function logs
supabase functions logs FUNCTION_NAME

# Test function locally (with Deno installed)
deno run --allow-all backend/supabase/functions/create-lead/index.ts
```

### Database Queries

```sql
-- View all leads
SELECT * FROM leads ORDER BY created_at DESC LIMIT 20;

-- Count leads by category
SELECT category, COUNT(*) FROM leads GROUP BY category;

-- View hot leads only
SELECT company_name, lead_score, created_at
FROM leads
WHERE category = 'Hot'
ORDER BY lead_score DESC;

-- Delete test leads
DELETE FROM leads WHERE email LIKE '%@test.com';

-- Reset database (⚠️ CAREFUL - deletes all data)
TRUNCATE leads, activities, notifications RESTART IDENTITY CASCADE;
```

### Useful URLs

**Your Project URLs** (replace YOUR_PROJECT_REF):
- Supabase Dashboard: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Database URL: `https://YOUR_PROJECT_REF.supabase.co`
- Edge Functions: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/`
- Webflow Site: `https://your-site-name.webflow.io`

**Third-Party Dashboards:**
- SendGrid: https://app.sendgrid.com
- Slack Webhooks: https://api.slack.com/apps

---

## Getting Help

### Official Documentation
- **Supabase:** https://supabase.com/docs
- **Webflow:** https://university.webflow.com
- **SendGrid:** https://docs.sendgrid.com
- **Slack Webhooks:** https://api.slack.com/messaging/webhooks

### Community Support
- **Supabase Discord:** https://discord.supabase.com
- **Webflow Forum:** https://forum.webflow.com

### Project-Specific Issues
- Check `docs/` folder for detailed specifications
- Review troubleshooting section above
- Check Edge Function logs for errors
- Test each component individually to isolate issue

---

## Security Reminders

**Never commit to Git:**
- ❌ `.env` files
- ❌ Supabase service_role key
- ❌ SendGrid API key
- ❌ Slack webhook URL
- ❌ Database passwords

**Add to .gitignore:**
```
.env
.env.local
*.key
secrets.json
```

**Rotate keys immediately if exposed:**
1. Generate new key in service dashboard
2. Update in Supabase Edge Function secrets
3. Revoke old key

---

## Success Checklist

Before considering setup complete:

- [ ] Database tables created (5 tables visible in Supabase)
- [ ] Test users exist in `users` table (3 users)
- [ ] Edge Functions deployed (2 functions)
- [ ] Environment variables set (4 secrets)
- [ ] Webflow form published and accessible
- [ ] Form submission creates lead in database
- [ ] Hot lead triggers Slack notification
- [ ] Hot lead triggers email alerts
- [ ] Dashboard loads and shows leads
- [ ] Dashboard filters work
- [ ] Status updates work
- [ ] Real-time updates work (new lead appears automatically)

**All checked? Congratulations! 🎉 Your lead qualification system is running!**

---

**Total Setup Time:** 2-3 hours for first-time setup

**Need help?** Review the troubleshooting section or check official documentation links above.
