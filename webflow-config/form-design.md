# Webflow Lead Capture Form - Complete Design Specification

## Form Purpose

**Business Goal:** Capture structured lead data with high completion rate (>60%) while collecting enough information for accurate scoring.

**Design Principle:** Balance data collection with user friction. Each field must justify its existence.

---

## Page Structure

### Page 1: Landing Page (/)

**URL:** `https://yourcompany.com/get-demo`
**Template:** Use Webflow "Contact" page template as starting point

**Layout:**
```
┌─────────────────────────────────────┐
│  HEADER (Logo + Nav)                │
├─────────────────────────────────────┤
│  HERO SECTION                       │
│  ┌──────────┐  ┌────────────────┐  │
│  │          │  │                │  │
│  │  Value   │  │  LEAD FORM     │  │
│  │  Props   │  │  (Right Side)  │  │
│  │  (Left)  │  │                │  │
│  │          │  └────────────────┘  │
│  └──────────┘                       │
├─────────────────────────────────────┤
│  SOCIAL PROOF (Logos, testimonial)  │
├─────────────────────────────────────┤
│  FOOTER                             │
└─────────────────────────────────────┘
```

**Hero Copy (Left Side):**
- **Headline:** "Get a personalized demo in 24 hours"
- **Subheadline:** "See how [Product Name] helps sales teams qualify leads 3x faster"
- **Bullet Points:**
  - ✓ No credit card required
  - ✓ 15-minute setup
  - ✓ Used by 500+ B2B companies

**Form (Right Side):** See detailed form spec below

---

## Form Fields Specification

### Form Element Settings in Webflow

**Form Name:** `lead-capture-form`
**Form Action:** POST to backend API endpoint `/api/leads`
**Form Method:** POST
**Redirect URL on Success:** `/thank-you`

---

### Field 1: Contact Name ✱ (Required)

**Field Type:** Text Input
**Name Attribute:** `contact_name`
**Placeholder:** "John Doe"
**Label:** "Full Name"
**Validation:**
- Required: Yes
- Min Length: 2 characters
- Pattern: Letters, spaces, hyphens only

**Why This Field:**
- Personalize sales outreach
- Verify lead is a real person

**Webflow Settings:**
```
Field Type: Text
Name: contact_name
Required: Yes
Placeholder: John Doe
```

---

### Field 2: Work Email ✱ (Required)

**Field Type:** Email Input
**Name Attribute:** `email`
**Placeholder:** "john@company.com"
**Label:** "Work Email"
**Validation:**
- Required: Yes
- Email format validation
- Block free emails (Gmail, Yahoo) with warning message (optional)

**Why This Field:**
- Primary contact method
- Email domain signals company legitimacy (5pt score boost for corporate emails)

**Webflow Settings:**
```
Field Type: Email
Name: email
Required: Yes
Placeholder: john@company.com
```

**Custom Validation (Webflow Logic or JS):**
```javascript
// Warn if free email domain
const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
const emailDomain = email.split('@')[1];

if (freeEmailDomains.includes(emailDomain)) {
  showWarning("For faster response, please use your work email.");
}
```

---

### Field 3: Company Name ✱ (Required)

**Field Type:** Text Input
**Name Attribute:** `company_name`
**Placeholder:** "Acme Corp"
**Label:** "Company Name"
**Validation:**
- Required: Yes
- Min Length: 2 characters

**Why This Field:**
- Account identification
- Deduplication
- Company research for enrichment

**Webflow Settings:**
```
Field Type: Text
Name: company_name
Required: Yes
Placeholder: Acme Corp
```

---

### Field 4: Phone Number (Optional)

**Field Type:** Phone Input
**Name Attribute:** `phone`
**Placeholder:** "+1 (555) 123-4567"
**Label:** "Phone Number (Optional)"
**Validation:**
- Required: No
- Format: International format preferred

**Why This Field:**
- Backup contact method for hot leads
- Enables immediate phone outreach

**Webflow Settings:**
```
Field Type: Phone
Name: phone
Required: No
Placeholder: +1 (555) 123-4567
```

---

### Field 5: Company Size ✱ (Required)

**Field Type:** Dropdown Select
**Name Attribute:** `company_size`
**Label:** "Company Size"
**Options:**
- "Select company size" (default, disabled)
- "1-10 employees" (5pts)
- "11-50 employees" (10pts)
- "51-200 employees" (20pts)
- "201-1000 employees" (30pts)
- "1000+ employees" (25pts)

**Why This Field:**
- **Most important scoring field (0-30pts)**
- Indicates budget capacity
- Filters out solopreneurs vs enterprise

**Webflow Settings:**
```
Field Type: Select
Name: company_size
Required: Yes
Options:
  - Select company size (value: "", disabled)
  - 1-10 employees (value: "1-10")
  - 11-50 employees (value: "11-50")
  - 51-200 employees (value: "51-200")
  - 201-1000 employees (value: "201-1000")
  - 1000+ employees (value: "1000+")
```

---

### Field 6: Industry ✱ (Required)

**Field Type:** Dropdown Select
**Name Attribute:** `industry`
**Label:** "Industry"
**Options:**
- "Select industry" (default, disabled)
- "Software/SaaS" (20pts)
- "Marketing/Advertising" (18pts)
- "Financial Services" (18pts)
- "Healthcare" (15pts)
- "Professional Services" (12pts)
- "Manufacturing" (10pts)
- "Retail/E-commerce" (10pts)
- "Education" (5pts)
- "Non-Profit" (3pts)
- "Other" (8pts)

**Why This Field:**
- **ICP fit indicator (0-20pts)**
- Helps rep prepare for conversation
- Filters low-value industries

**Webflow Settings:**
```
Field Type: Select
Name: industry
Required: Yes
Options: [See above list]
```

---

### Field 7: What Brings You Here Today? ✱ (Required)

**Field Type:** Radio Buttons or Dropdown
**Name Attribute:** `inquiry_type`
**Label:** "What brings you here today?"
**Options:**
- "Request a demo" (30pts) [Default selected]
- "Get pricing information" (25pts)
- "Talk to sales" (25pts)
- "General question" (15pts)
- "Download resources" (5pts)

**Why This Field:**
- **Highest intent signal (0-30pts)**
- Demo request = hot lead
- Resource download = cold lead (nurture track)

**Webflow Settings:**
```
Field Type: Radio Buttons (better UX than dropdown)
Name: inquiry_type
Required: Yes
Default: "Request a demo"
Options:
  - Request a demo (value: "Demo Request")
  - Get pricing information (value: "Pricing Information")
  - Talk to sales (value: "Contact Sales")
  - General question (value: "General Question")
  - Download resources (value: "Content Download")
```

**Design Note:** Use radio buttons instead of dropdown so user sees all options without clicking. Increases data quality.

---

### Field 8: When Are You Looking to Purchase? ✱ (Required)

**Field Type:** Dropdown Select
**Name Attribute:** `budget_timeline`
**Label:** "When are you looking to purchase?"
**Options:**
- "Select timeline" (default, disabled)
- "Immediately (within 1 month)" (20pts)
- "1-3 months" (15pts)
- "3-6 months" (10pts)
- "6-12 months" (5pts)
- "Just researching" (0pts)

**Why This Field:**
- **Sales readiness indicator (0-20pts)**
- Prioritizes in-market buyers
- Sets sales expectations

**Webflow Settings:**
```
Field Type: Select
Name: budget_timeline
Required: Yes
Options: [See above list]
```

---

### Field 9: Current Solution (Optional)

**Field Type:** Text Input
**Name Attribute:** `current_solution`
**Placeholder:** "Currently using [Competitor Name]"
**Label:** "What solution are you currently using? (Optional)"
**Validation:** No validation, free text

**Why This Field:**
- Competitive intelligence
- Helps rep tailor demo to pain points
- Not scored, but valuable for qualification

**Webflow Settings:**
```
Field Type: Text
Name: current_solution
Required: No
Placeholder: Currently using [Competitor Name]
```

---

### Field 10: Anything Else We Should Know? (Optional)

**Field Type:** Textarea
**Name Attribute:** `message`
**Placeholder:** "Tell us about your needs..."
**Label:** "Anything else we should know? (Optional)"
**Max Length:** 500 characters

**Why This Field:**
- Capture specific pain points
- Context for sales conversation
- Not scored, but qualitative value

**Webflow Settings:**
```
Field Type: Textarea
Name: message
Required: No
Placeholder: Tell us about your needs...
Max Length: 500
Rows: 4
```

---

### Hidden Fields (UTM Tracking)

**Purpose:** Track campaign source for lead attribution

**Fields:**
- `utm_source` (e.g., "google", "linkedin")
- `utm_medium` (e.g., "cpc", "organic")
- `utm_campaign` (e.g., "q4-demo-push")

**Implementation:**
```javascript
// Webflow custom code (before </body>)
<script>
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);

  document.querySelector('[name="utm_source"]').value = urlParams.get('utm_source') || '';
  document.querySelector('[name="utm_medium"]').value = urlParams.get('utm_medium') || '';
  document.querySelector('[name="utm_campaign"]').value = urlParams.get('utm_campaign') || '';
});
</script>
```

---

## Form Styling (Webflow Designer)

### Layout
- **Container Width:** 500px max
- **Field Spacing:** 20px margin between fields
- **Label Style:** 14px, #333, medium weight
- **Input Style:** 16px (mobile-friendly), #555, 48px height, 12px padding
- **Required Indicator:** Red asterisk (✱) after label

### Button
- **Text:** "Get Your Demo" (action-oriented, not "Submit")
- **Style:** Primary brand color, 48px height, full width
- **Hover State:** Darken by 10%
- **Loading State:** Show spinner, disable button, text = "Submitting..."

### Validation Errors
- **Position:** Below each field
- **Style:** Red text (#d32f2f), 12px, italic
- **Example:** "Please enter a valid work email"

---

## Form Validation Rules

### Client-Side Validation (Webflow Native + Custom JS)

**Required Field Validation:**
```javascript
// Webflow handles basic "required" attribute
// Custom validation for quality:

function validateForm(event) {
  let isValid = true;
  const errors = [];

  // 1. Name validation (no numbers)
  const contactName = document.querySelector('[name="contact_name"]').value;
  if (/\d/.test(contactName)) {
    errors.push("Name cannot contain numbers");
    isValid = false;
  }

  // 2. Email validation (corporate preferred)
  const email = document.querySelector('[name="email"]').value;
  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
  const emailDomain = email.split('@')[1];

  if (freeEmailDomains.includes(emailDomain)) {
    // Warning, but don't block submission
    showWarning("Work email preferred for faster response");
  }

  // 3. Company name validation (not "test", "asdf")
  const companyName = document.querySelector('[name="company_name"]').value.toLowerCase();
  const spamKeywords = ['test', 'asdf', 'qwerty', 'xxx'];

  if (spamKeywords.some(keyword => companyName.includes(keyword))) {
    errors.push("Please enter a valid company name");
    isValid = false;
  }

  // 4. Phone validation (if provided)
  const phone = document.querySelector('[name="phone"]').value;
  if (phone && phone.length < 10) {
    errors.push("Please enter a valid phone number");
    isValid = false;
  }

  if (!isValid) {
    event.preventDefault();
    displayErrors(errors);
  }

  return isValid;
}

// Attach to form submit
document.querySelector('#lead-capture-form').addEventListener('submit', validateForm);
```

### Server-Side Validation (Backend API)

**All client-side validation MUST be repeated server-side** (client validation can be bypassed).

See backend API section for validation logic.

---

## Form Submission Flow

### User Journey

```
1. User lands on /get-demo
     ↓
2. Fills out form (avg 90 seconds)
     ↓
3. Clicks "Get Your Demo"
     ↓
4. Client-side validation runs
     ↓ (if valid)
5. Form submits to POST /api/leads
     ↓
6. Backend calculates score, creates lead record
     ↓
7. Backend returns 200 OK
     ↓
8. User redirected to /thank-you
     ↓
9. Thank-you page shows:
    - "Thanks! We received your request."
    - "A team member will contact you within [X hours]"
    - Expected timeline based on lead score:
      * Hot lead (80-100): "within 1 hour"
      * Warm lead (50-79): "within 24 hours"
      * Cold lead (0-49): "we'll send resources via email"
```

### Error Handling

**Scenario 1: API Endpoint Down**
```
Error Message: "We're having trouble processing your request. Please try again in a moment."
Action: Log error to monitoring (Sentry), retry submission after 3 seconds
```

**Scenario 2: Duplicate Email Submitted**
```
API Response: 409 Conflict
Error Message: "We already have a request from this email. A team member will contact you soon."
Action: Don't create new lead, show existing lead status
```

**Scenario 3: Spam Detected**
```
API Response: 400 Bad Request
Error Message: "Please complete all fields accurately."
Action: Don't reveal spam detection logic (security)
```

---

## Thank You Page (/thank-you)

**Purpose:** Confirm submission, set expectations, keep user engaged

**Content:**
```
┌────────────────────────────────────┐
│  ✓ SUCCESS ICON (green)            │
│                                    │
│  Thank You!                        │
│  We received your demo request.    │
│                                    │
│  What happens next?                │
│  1. We'll review your information  │
│  2. A team member will reach out   │
│     within [TIMELINE]              │
│  3. We'll schedule a personalized  │
│     15-minute demo                 │
│                                    │
│  In the meantime:                  │
│  → [Watch 2-min product video]     │
│  → [Read customer case study]      │
│  → [Browse pricing page]           │
│                                    │
│  Questions? Email sales@company.com│
└────────────────────────────────────┘
```

**Dynamic Timeline (Based on Score):**
```javascript
// Webflow Logic or custom code
// Pass score via URL param: /thank-you?score=85

const score = new URLSearchParams(window.location.search).get('score');
let timeline;

if (score >= 80) {
  timeline = "within 1 hour";
} else if (score >= 50) {
  timeline = "within 24 hours";
} else {
  timeline = "this week, or we'll send helpful resources via email";
}

document.querySelector('#timeline').innerText = timeline;
```

**Analytics Tracking:**
- Fire conversion pixel (Google Ads, LinkedIn Ads)
- Track event in analytics: `form_submitted`
- Properties: `{score: 85, category: "Hot"}`

---

## Webflow-Specific Implementation Steps

### Step 1: Create Form Page

1. In Webflow Designer, create new page: `/get-demo`
2. Add Section element → set max-width 1200px
3. Add Container → 2-column layout (50/50 on desktop, stack on mobile)
4. Left column: Add HTML Embed for value props
5. Right column: Add Form Block

### Step 2: Configure Form Element

1. Select Form Block → Form Settings:
   - **Form Name:** lead-capture-form
   - **Action:** Leave blank (we'll handle with custom code)
   - **Method:** POST
   - **Redirect:** /thank-you

2. Add form fields as specified above:
   - Drag "Text Input" for name, email, company, phone, current solution
   - Drag "Select" for company size, industry, budget timeline
   - Drag "Radio Buttons" for inquiry type
   - Drag "Text Area" for message

3. For each field:
   - Set Name attribute (must match API)
   - Set Placeholder text
   - Check "Required" if applicable
   - Set Label text

### Step 3: Add Hidden UTM Fields

1. Drag 3x "Hidden Input" fields
2. Set Name attributes: `utm_source`, `utm_medium`, `utm_campaign`
3. Leave Value blank (populated by JavaScript)

### Step 4: Style Form

1. Select form → set max-width 500px
2. Style inputs: 48px height, 16px font, 12px padding
3. Style button: Primary color, 48px height, full width
4. Add spacing: 20px margin-bottom on each field
5. Mobile responsive: Stack all fields vertically

### Step 5: Add Custom Code

**In Page Settings → Custom Code → Before </body>:**

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
document.querySelector('#lead-capture-form').addEventListener('submit', async function(event) {
  event.preventDefault(); // Prevent default Webflow form submission

  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData.entries());

  try {
    // Show loading state
    const submitBtn = event.target.querySelector('input[type="submit"]');
    submitBtn.value = 'Submitting...';
    submitBtn.disabled = true;

    // Submit to backend API
    const response = await fetch('https://your-backend.com/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      // Redirect to thank you page with score
      window.location.href = `/thank-you?score=${result.score}`;
    } else {
      throw new Error('Submission failed');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    alert('We encountered an issue. Please try again.');

    // Reset button
    const submitBtn = event.target.querySelector('input[type="submit"]');
    submitBtn.value = 'Get Your Demo';
    submitBtn.disabled = false;
  }
});
</script>
```

### Step 6: Create Thank You Page

1. Create new page: `/thank-you`
2. Add success message (see content above)
3. Add dynamic timeline text with HTML Embed:
```html
<div id="timeline"></div>
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

  document.querySelector('#timeline').innerText = `A team member will reach out ${timeline}.`;
</script>
```

### Step 7: Test Form

**Test Checklist:**
- [ ] All required fields show validation error if empty
- [ ] Email field validates format
- [ ] Dropdowns show all options
- [ ] Radio buttons work (only one selectable)
- [ ] UTM parameters populate correctly (test with `?utm_source=test`)
- [ ] Form submits to backend API
- [ ] Thank you page displays correct timeline
- [ ] Mobile responsive (all fields stack, readable on 375px width)

---

## Alternative: Webflow Native Form (No Custom Code)

If you want to avoid custom JavaScript and use Webflow's native form handling:

### Limitations:
- Can't submit to custom API endpoint (submits to Webflow)
- Can't calculate score on client-side
- Must use Zapier/Make to:
  1. Receive Webflow form submission
  2. Call your backend API
  3. Calculate score
  4. Create lead record

### Benefits:
- No code required
- Webflow handles spam protection
- Email notifications built-in

**Recommendation:** Use custom code approach for full control and real-time scoring.

---

## Form Conversion Optimization

### A/B Testing Ideas (Future)

**Test 1: Form Length**
- Control: 10 fields (current spec)
- Variant: 6 fields (name, email, company, inquiry type, company size, timeline)
- Hypothesis: Shorter form increases completion rate but may reduce score accuracy

**Test 2: Button Copy**
- Control: "Get Your Demo"
- Variant A: "See It In Action"
- Variant B: "Schedule Demo"
- Hypothesis: Action-oriented copy increases clicks

**Test 3: Social Proof Position**
- Control: Below form
- Variant: Above form (customer logos + "Trusted by 500+ companies")
- Hypothesis: Social proof above form increases trust, completion rate

### Expected Conversion Rates

- **Landing page → Form start:** 40-50%
- **Form start → Form submit:** 60-70%
- **Overall conversion (visit → submit):** 25-35%

---

This Webflow form is **ready to implement, conversion-optimized, and designed for data quality**.
