// Supabase Edge Function: create-lead
// Purpose: Validate form data, calculate lead score, insert into database
// Trigger: POST from Webflow form submission

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// LEAD SCORING LOGIC
// ============================================

interface FormData {
  contact_name: string
  email: string
  company_name: string
  phone?: string
  company_size?: string
  industry?: string
  inquiry_type?: string
  budget_timeline?: string
  current_solution?: string
  message?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

interface ScoreResult {
  score: number
  category: string
  breakdown: {
    companySize: number
    industry: number
    inquiryType: number
    budgetTimeline: number
    emailValidation: number
  }
}

function calculateLeadScore(data: FormData): ScoreResult {
  let score = 0
  const breakdown = {
    companySize: 0,
    industry: 0,
    inquiryType: 0,
    budgetTimeline: 0,
    emailValidation: 0,
  }

  // 1. Company Size (0-30 points)
  const sizeScores: { [key: string]: number } = {
    '1-10': 5,
    '11-50': 10,
    '51-200': 20,
    '201-1000': 30,
    '1000+': 25,
  }
  breakdown.companySize = sizeScores[data.company_size || ''] || 0
  score += breakdown.companySize

  // 2. Industry (0-20 points)
  const industryScores: { [key: string]: number } = {
    'Software/SaaS': 20,
    'Marketing/Advertising': 18,
    'Financial Services': 18,
    'Healthcare': 15,
    'Professional Services': 12,
    'Manufacturing': 10,
    'Retail/E-commerce': 10,
    'Education': 5,
    'Non-Profit': 3,
    'Other': 8,
  }
  breakdown.industry = industryScores[data.industry || ''] || 0
  score += breakdown.industry

  // 3. Inquiry Type (0-30 points)
  const inquiryScores: { [key: string]: number } = {
    'Demo Request': 30,
    'Pricing Information': 25,
    'Contact Sales': 25,
    'General Question': 15,
    'Content Download': 5,
    'Partnership Inquiry': 10,
  }
  breakdown.inquiryType = inquiryScores[data.inquiry_type || ''] || 0
  score += breakdown.inquiryType

  // 4. Budget Timeline (0-20 points)
  const timelineScores: { [key: string]: number } = {
    'Immediate': 20,
    '1-3 months': 15,
    '3-6 months': 10,
    '6-12 months': 5,
    'Just Researching': 0,
  }
  breakdown.budgetTimeline = timelineScores[data.budget_timeline || ''] || 0
  score += breakdown.budgetTimeline

  // 5. Email Validation (0-5 points)
  const email = (data.email || '').toLowerCase()
  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']

  if (!email.includes('@')) {
    breakdown.emailValidation = 0
  } else if (freeEmailDomains.some(domain => email.includes(domain))) {
    breakdown.emailValidation = 0
  } else if (email.includes('.edu')) {
    breakdown.emailValidation = 2
  } else {
    breakdown.emailValidation = 5 // Corporate email
  }
  score += breakdown.emailValidation

  // Cap score at 100
  const finalScore = Math.min(score, 100)

  // Determine category
  let category: string
  if (finalScore >= 80) {
    category = 'Hot'
  } else if (finalScore >= 50) {
    category = 'Warm'
  } else {
    category = 'Cold'
  }

  return {
    score: finalScore,
    category,
    breakdown,
  }
}

// ============================================
// VALIDATION
// ============================================

function validateFormData(data: FormData): string[] {
  const errors: string[] = []

  // Required fields
  if (!data.contact_name || data.contact_name.trim().length < 2) {
    errors.push('Contact name is required (min 2 characters)')
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required')
  }

  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.push('Company name is required (min 2 characters)')
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format')
  }

  // Check for spam indicators
  const spamKeywords = ['test', 'asdf', 'qwerty', 'xxx', 'spam']
  const companyNameLower = (data.company_name || '').toLowerCase()

  if (spamKeywords.some(keyword => companyNameLower.includes(keyword))) {
    errors.push('Invalid company name')
  }

  // Name validation (no numbers)
  if (data.contact_name && /\d/.test(data.contact_name)) {
    errors.push('Contact name cannot contain numbers')
  }

  return errors
}

function isSpamSubmission(data: FormData): boolean {
  const spamIndicators = [
    // Email is test@test.com
    data.email === 'test@test.com',

    // Company name is very short
    (data.company_name || '').length < 3,

    // Company name is all numbers
    /^\d+$/.test(data.company_name || ''),

    // Email domain matches company name suspiciously
    // (Skip for now, could add domain validation)
  ]

  return spamIndicators.some(indicator => indicator)
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const formData: FormData = await req.json()

    console.log('Received form submission:', {
      email: formData.email,
      company: formData.company_name,
    })

    // 1. Validate form data
    const validationErrors = validateFormData(formData)
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationErrors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Check for spam
    if (isSpamSubmission(formData)) {
      console.log('Spam submission detected:', formData.email)

      // Still return 200 to not reveal spam detection
      // But mark lead as spam in database
      formData.company_name = '[SPAM] ' + formData.company_name
    }

    // 3. Calculate lead score
    const scoreResult = calculateLeadScore(formData)

    console.log('Calculated score:', {
      score: scoreResult.score,
      category: scoreResult.category,
      breakdown: scoreResult.breakdown,
    })

    // 4. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 5. Check for duplicate email (within 24 hours)
    const { data: existingLeads, error: checkError } = await supabase
      .from('leads')
      .select('id, email, created_at')
      .eq('email', formData.email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq('is_deleted', false)

    if (checkError) {
      console.error('Error checking duplicates:', checkError)
      // Continue anyway, don't block submission
    }

    if (existingLeads && existingLeads.length > 0) {
      console.log('Duplicate email detected:', formData.email)

      return new Response(
        JSON.stringify({
          error: 'Duplicate submission',
          message: 'We already received your request. A team member will contact you soon.',
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 6. Insert lead into database
    const leadData = {
      contact_name: formData.contact_name,
      email: formData.email,
      company_name: formData.company_name,
      phone: formData.phone || null,
      company_size: formData.company_size || null,
      industry: formData.industry || null,
      inquiry_type: formData.inquiry_type || null,
      budget_timeline: formData.budget_timeline || null,
      current_solution: formData.current_solution || null,
      message: formData.message || null,
      lead_score: scoreResult.score,
      category: scoreResult.category,
      score_breakdown: scoreResult.breakdown,
      raw_score: scoreResult.score,
      status: 'New',
      source: 'Webflow Form',
      utm_source: formData.utm_source || null,
      utm_medium: formData.utm_medium || null,
      utm_campaign: formData.utm_campaign || null,
      is_spam: isSpamSubmission(formData),
      last_activity_date: new Date().toISOString(),
    }

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting lead:', insertError)

      return new Response(
        JSON.stringify({
          error: 'Database error',
          message: 'Failed to save your submission. Please try again.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Lead created successfully:', newLead.id)

    // 7. Log activity
    await supabase.from('activities').insert([
      {
        lead_id: newLead.id,
        action_type: 'lead_created',
        new_value: JSON.stringify({ score: scoreResult.score }),
        description: `Lead created with score ${scoreResult.score}`,
      },
    ])

    // 8. Trigger notifications if Hot lead
    if (scoreResult.category === 'Hot') {
      console.log('Hot lead detected, triggering notifications')

      // Call send-notification function
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            lead_id: newLead.id,
            type: 'hot_lead_alert',
          }),
        })
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError)
        // Don't fail the request if notification fails
      }
    }

    // 9. Auto-assign to rep (if Hot or Warm)
    if (scoreResult.category === 'Hot' || scoreResult.category === 'Warm') {
      try {
        const { data: nextRep } = await supabase.rpc('get_next_available_rep')

        if (nextRep) {
          await supabase.rpc('assign_lead', {
            lead_id: newLead.id,
            rep_id: nextRep,
          })

          console.log('Lead auto-assigned to rep:', nextRep)
        }
      } catch (assignError) {
        console.error('Error auto-assigning lead:', assignError)
        // Don't fail the request if assignment fails
      }
    }

    // 10. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        lead_id: newLead.id,
        score: scoreResult.score,
        category: scoreResult.category,
        message: 'Thank you! Your request has been received.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Something went wrong. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
