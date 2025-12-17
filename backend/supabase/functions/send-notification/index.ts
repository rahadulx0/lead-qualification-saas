// Supabase Edge Function: send-notification
// Purpose: Send Slack alerts and email notifications for hot leads
// Trigger: Called by create-lead function when Hot lead is created

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// NOTIFICATION TYPES
// ============================================

interface NotificationRequest {
  lead_id: string
  type: 'hot_lead_alert' | 'warm_lead_assignment' | 'cold_lead_nurture'
}

interface Lead {
  id: string
  contact_name: string
  email: string
  company_name: string
  phone: string | null
  company_size: string | null
  industry: string | null
  inquiry_type: string | null
  budget_timeline: string | null
  lead_score: number
  category: string
  created_at: string
}

// ============================================
// SLACK NOTIFICATION
// ============================================

async function sendSlackNotification(lead: Lead): Promise<void> {
  const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')

  if (!slackWebhookUrl) {
    console.log('Slack webhook not configured, skipping Slack notification')
    return
  }

  // Format lead details for Slack
  const slackMessage = {
    text: '🔥 *HOT LEAD ALERT* 🔥',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🔥 HOT LEAD ALERT',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Company:*\n${lead.company_name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Score:*\n${lead.lead_score}/100`,
          },
          {
            type: 'mrkdwn',
            text: `*Contact:*\n${lead.contact_name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${lead.email}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Company Size:*\n${lead.company_size || 'Not specified'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Industry:*\n${lead.industry || 'Not specified'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Inquiry:*\n${lead.inquiry_type || 'Not specified'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Timeline:*\n${lead.budget_timeline || 'Not specified'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Phone:* ${lead.phone || 'Not provided'}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View in Dashboard',
              emoji: true,
            },
            url: `https://your-dashboard-url.com/leads/${lead.id}`,
            style: 'primary',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⏰ *Response Target:* Contact within 1 hour | Submitted: ${new Date(lead.created_at).toLocaleString()}`,
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    })

    if (!response.ok) {
      console.error('Slack API error:', await response.text())
      throw new Error(`Slack API returned ${response.status}`)
    }

    console.log('Slack notification sent successfully')
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
    throw error
  }
}

// ============================================
// EMAIL NOTIFICATION (SendGrid)
// ============================================

async function sendEmailNotification(lead: Lead): Promise<void> {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'sales@yourcompany.com'
  const salesTeamEmail = Deno.env.get('SALES_TEAM_EMAIL') || 'sales@yourcompany.com'

  if (!sendgridApiKey) {
    console.log('SendGrid API key not configured, skipping email notification')
    return
  }

  // Email to sales team (Hot lead alert)
  const emailBody = {
    personalizations: [
      {
        to: [{ email: salesTeamEmail }],
        subject: `🔥 HOT LEAD: ${lead.company_name} - Score ${lead.lead_score}`,
      },
    ],
    from: { email: fromEmail, name: 'Lead Qualification System' },
    content: [
      {
        type: 'text/html',
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #d32f2f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .score-badge { background: #fff; color: #d32f2f; font-size: 36px; font-weight: bold; padding: 10px 20px; border-radius: 8px; display: inline-block; margin-top: 10px; }
              .details { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
              .detail-row { margin-bottom: 15px; }
              .label { font-weight: bold; color: #555; }
              .value { color: #333; }
              .cta-button { display: inline-block; background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔥 HOT LEAD ALERT</h1>
                <div class="score-badge">${lead.lead_score}/100</div>
                <p style="margin-top: 15px;">⏰ <strong>Action Required:</strong> Contact within 1 hour</p>
              </div>

              <div class="details">
                <div class="detail-row">
                  <span class="label">Company:</span>
                  <span class="value">${lead.company_name}</span>
                </div>

                <div class="detail-row">
                  <span class="label">Contact:</span>
                  <span class="value">${lead.contact_name}</span>
                </div>

                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value"><a href="mailto:${lead.email}">${lead.email}</a></span>
                </div>

                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">${lead.phone || 'Not provided'}</span>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

                <div class="detail-row">
                  <span class="label">Company Size:</span>
                  <span class="value">${lead.company_size || 'Not specified'} employees</span>
                </div>

                <div class="detail-row">
                  <span class="label">Industry:</span>
                  <span class="value">${lead.industry || 'Not specified'}</span>
                </div>

                <div class="detail-row">
                  <span class="label">Inquiry Type:</span>
                  <span class="value">${lead.inquiry_type || 'Not specified'}</span>
                </div>

                <div class="detail-row">
                  <span class="label">Budget Timeline:</span>
                  <span class="value">${lead.budget_timeline || 'Not specified'}</span>
                </div>

                <div style="text-align: center;">
                  <a href="https://your-dashboard-url.com/leads/${lead.id}" class="cta-button">View Lead in Dashboard</a>
                </div>
              </div>

              <div class="footer">
                <p>Lead submitted at ${new Date(lead.created_at).toLocaleString()}</p>
                <p>This is an automated alert from the Lead Qualification System</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    ],
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify(emailBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SendGrid API error:', errorText)
      throw new Error(`SendGrid API returned ${response.status}`)
    }

    console.log('Email notification sent successfully')
  } catch (error) {
    console.error('Failed to send email notification:', error)
    throw error
  }
}

// ============================================
// CUSTOMER AUTO-RESPONSE EMAIL
// ============================================

async function sendCustomerAutoResponse(lead: Lead): Promise<void> {
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'sales@yourcompany.com'

  if (!sendgridApiKey) {
    console.log('SendGrid not configured, skipping auto-response')
    return
  }

  // Determine response time based on category
  let responseTime: string
  if (lead.category === 'Hot') {
    responseTime = 'within 1 hour'
  } else if (lead.category === 'Warm') {
    responseTime = 'within 24 hours'
  } else {
    responseTime = 'this week'
  }

  const emailBody = {
    personalizations: [
      {
        to: [{ email: lead.email, name: lead.contact_name }],
        subject: 'Thank you for your interest - We\'ll be in touch soon',
      },
    ],
    from: { email: fromEmail, name: 'Sales Team' },
    content: [
      {
        type: 'text/html',
        value: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 30px 0; }
              .checkmark { font-size: 64px; color: #4caf50; }
              h1 { color: #1976d2; margin-top: 20px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
              .next-steps { background: white; padding: 20px; border-left: 4px solid #1976d2; margin: 20px 0; }
              .resources { margin-top: 30px; }
              .resource-link { display: block; background: #1976d2; color: white; padding: 15px; text-decoration: none; border-radius: 8px; text-align: center; margin: 10px 0; }
              .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="checkmark">✓</div>
                <h1>Thank You, ${lead.contact_name}!</h1>
                <p>We received your request from ${lead.company_name}</p>
              </div>

              <div class="content">
                <div class="next-steps">
                  <h2>What happens next?</h2>
                  <ol>
                    <li>We'll review your information</li>
                    <li>A team member will reach out <strong>${responseTime}</strong></li>
                    <li>We'll schedule a personalized 15-minute demo</li>
                  </ol>
                </div>

                <div class="resources">
                  <h3>In the meantime, here are some resources:</h3>
                  <a href="https://yourcompany.com/demo-video" class="resource-link">▶ Watch 2-Minute Product Overview</a>
                  <a href="https://yourcompany.com/case-studies" class="resource-link">📄 Read Customer Success Stories</a>
                  <a href="https://yourcompany.com/pricing" class="resource-link">💰 Explore Pricing Options</a>
                </div>

                <p style="margin-top: 30px;">Questions? Reply to this email or call us at <strong>(555) 123-4567</strong></p>
              </div>

              <div class="footer">
                <p>Best regards,<br>The Sales Team</p>
                <p style="margin-top: 20px;">This email was sent because you submitted a form on our website.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
    ],
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sendgridApiKey}`,
      },
      body: JSON.stringify(emailBody),
    })

    if (!response.ok) {
      console.error('SendGrid auto-response error:', await response.text())
    } else {
      console.log('Customer auto-response sent successfully')
    }
  } catch (error) {
    console.error('Failed to send auto-response:', error)
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { lead_id, type }: NotificationRequest = await req.json()

    console.log('Sending notification:', { lead_id, type })

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch lead details
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (fetchError || !lead) {
      console.error('Error fetching lead:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Send notifications based on type
    const notifications: Promise<void>[] = []

    if (type === 'hot_lead_alert' && lead.category === 'Hot') {
      // Send Slack alert
      notifications.push(sendSlackNotification(lead))

      // Send email alert to sales team
      notifications.push(sendEmailNotification(lead))

      // Send auto-response to customer
      notifications.push(sendCustomerAutoResponse(lead))
    }

    // Wait for all notifications to complete
    const results = await Promise.allSettled(notifications)

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`Notifications sent: ${successful} successful, ${failed} failed`)

    // Log to database
    for (const result of results) {
      await supabase.from('notifications').insert([
        {
          lead_id,
          notification_type: 'slack',
          status: result.status === 'fulfilled' ? 'sent' : 'failed',
          error_message: result.status === 'rejected' ? result.reason?.toString() : null,
        },
      ])
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Notification error:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to send notifications',
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
