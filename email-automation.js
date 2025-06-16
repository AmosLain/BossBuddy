// ===================================
// EMAIL AUTOMATION SYSTEM
// ===================================

// services/emailService.js
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===================================
// EMAIL TEMPLATES
// ===================================

// emails/WelcomeEmail.tsx
export const WelcomeEmail = ({ userName, plan }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ 
      background: 'linear-gradient(to right, #3B82F6, #8B5CF6)', 
      padding: '40px 20px', 
      textAlign: 'center' 
    }}>
      <h1 style={{ color: 'white', margin: 0 }}>Welcome to BossBuddy! 🎉</h1>
    </div>
    
    <div style={{ padding: '30px 20px' }}>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Hi {userName || 'there'},
      </p>
      
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Congrats on taking the first step to stress-free work communication! 
        You're about to save hours every week and impress your boss with perfectly crafted messages.
      </p>
      
      {plan === 'free' ? (
        <>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>🆓 Your Free Plan Includes:</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>3 message rewrites per day</li>
              <li>4 professional tones</li>
              <li>Basic templates</li>
            </ul>
          </div>
          
          <div style={{ 
            background: '#FEF3C7', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>🚀 Ready for More?</h3>
            <p>Unlock unlimited rewrites and 12+ tones for just $1.99/month!</p>
            <a href="https://bossbuddy.ai/upgrade" style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#8B5CF6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              marginTop: '10px'
            }}>
              Start Free Trial
            </a>
          </div>
        </>
      ) : (
        <div style={{ 
          background: '#D1FAE5', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>✨ Your Pro Features Are Active!</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>Unlimited message rewrites</li>
            <li>12+ professional tones</li>
            <li>Message history</li>
            <li>Priority processing</li>
          </ul>
        </div>
      )}
      
      <h3>Quick Start Guide:</h3>
      <ol style={{ lineHeight: '1.8' }}>
        <li>Type or paste your message</li>
        <li>Choose a tone (Formal, Friendly, etc.)</li>
        <li>Click "Rewrite Message"</li>
        <li>Copy and send to your boss!</li>
      </ol>
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a href="https://bossbuddy.ai" style={{
          display: 'inline-block',
          padding: '15px 30px',
          background: '#3B82F6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '16px'
        }}>
          Start Writing Better Messages
        </a>
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '14px', color: '#6B7280' }}>
        Questions? Just reply to this email - we're here to help!
      </p>
    </div>
    
    <div style={{ 
      background: '#F9FAFB', 
      padding: '20px', 
      textAlign: 'center',
      fontSize: '12px',
      color: '#6B7280'
    }}>
      <p>© 2024 BossBuddy. Made with ❤️ for better workplace communication.</p>
      <p>
        <a href="%unsubscribe_url%" style={{ color: '#6B7280' }}>Unsubscribe</a> | 
        <a href="https://bossbuddy.ai/settings" style={{ color: '#6B7280', marginLeft: '10px' }}>Settings</a>
      </p>
    </div>
  </div>
);

// emails/UsageReport.tsx
export const UsageReportEmail = ({ 
  userName, 
  weeklyStats, 
  savedMinutes, 
  popularTone,
  streak 
}) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ 
      background: 'linear-gradient(to right, #3B82F6, #8B5CF6)', 
      padding: '30px 20px', 
      textAlign: 'center' 
    }}>
      <h2 style={{ color: 'white', margin: 0 }}>Your Weekly BossBuddy Report 📊</h2>
    </div>
    
    <div style={{ padding: '30px 20px' }}>
      <p style={{ fontSize: '16px', marginBottom: '20px' }}>
        Hi {userName},
      </p>
      
      <p style={{ marginBottom: '30px' }}>
        Here's how BossBuddy helped you communicate better this week:
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: '#EFF6FF', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#3B82F6', margin: '0 0 10px 0' }}>
            {weeklyStats.messagesRewritten}
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Messages Rewritten</p>
        </div>
        
        <div style={{ 
          background: '#F3E8FF', 
          padding: '20px', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#8B5CF6', margin: '0 0 10px 0' }}>
            {savedMinutes} min
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>Time Saved</p>
        </div>
      </div>
      
      {streak > 0 && (
        <div style={{ 
          background: '#FEF3C7', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>
            🔥 {streak}-day streak! Keep it up!
          </p>
        </div>
      )}
      
      <p style={{ marginBottom: '20px' }}>
        <strong>Your favorite tone:</strong> {popularTone} 
        (used {weeklyStats.toneUsage[popularTone] || 0} times)
      </p>
      
      {weeklyStats.plan === 'free' && weeklyStats.messagesRewritten >= 15 && (
        <div style={{ 
          background: '#DBEAFE', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>💡 Pro Tip</h3>
          <p>
            You used BossBuddy {weeklyStats.messagesRewritten} times this week! 
            With Pro ($1.99/mo), you'd have unlimited rewrites and saved even more time.
          </p>
          <a href="https://bossbuddy.ai/upgrade?src=weekly-email" style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#3B82F6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            marginTop: '10px'
          }}>
            Upgrade to Pro
          </a>
        </div>
      )}
      
      <h3>✨ This Week's Pro Tips:</h3>
      <ul style={{ lineHeight: '1.8' }}>
        <li>Try the "Diplomatic" tone for sensitive topics</li>
        <li>Use templates for common requests to save even more time</li>
        <li>Add context about urgency for better AI suggestions</li>
      </ul>
    </div>
    
    <div style={{ 
      background: '#F9FAFB', 
      padding: '20px', 
      textAlign: 'center',
      fontSize: '12px',
      color: '#6B7280'
    }}>
      <p>Keep crushing those work communications! 💪</p>
      <p>
        <a href="%unsubscribe_url%" style={{ color: '#6B7280' }}>Unsubscribe</a> | 
        <a href="https://bossbuddy.ai/settings" style={{ color: '#6B7280', marginLeft: '10px' }}>Email Preferences</a>
      </p>
    </div>
  </div>
);

// emails/TrialEndingEmail.tsx
export const TrialEndingEmail = ({ userName, hoursLeft }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ 
      background: '#FEF3C7', 
      padding: '30px 20px', 
      textAlign: 'center' 
    }}>
      <h2 style={{ color: '#92400E', margin: 0 }}>
        ⏰ Your Pro Trial Ends in {hoursLeft} Hours
      </h2>
    </div>
    
    <div style={{ padding: '30px 20px' }}>
      <p>Hi {userName},</p>
      
      <p>Your BossBuddy Pro trial is almost over! Don't lose access to:</p>
      
      <ul style={{ lineHeight: '1.8', marginBottom: '20px' }}>
        <li>✅ Unlimited message rewrites</li>
        <li>✅ 12+ professional tones</li>
        <li>✅ Message history</li>
        <li>✅ Priority AI processing</li>
      </ul>
      
      <div style={{ 
        background: '#EFF6FF', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0 }}>🎁 Special Offer</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
          Get 20% OFF Your First Month
        </p>
        <p style={{ margin: '0 0 15px 0' }}>
          Only $1.59 instead of $1.99
        </p>
        <a href="https://bossbuddy.ai/upgrade?discount=TRIAL20" style={{
          display: 'inline-block',
          padding: '12px 30px',
          background: '#3B82F6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
          fontSize: '16px'
        }}>
          Continue with Pro
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>
        This offer expires when your trial ends. No commitment - cancel anytime.
      </p>
    </div>
  </div>
);

// ===================================
// EMAIL AUTOMATION ENGINE
// ===================================

export class EmailAutomation {
  constructor() {
    this.sequences = {
      onboarding: [
        { delay: 0, template: 'welcome' },
        { delay: 3, template: 'tips_getting_started' },
        { delay: 7, template: 'first_week_checkin' },
        { delay: 14, template: 'feature_spotlight' },
        { delay: 30, template: 'success_stories' }
      ],
      
      trial: [
        { delay: 0, template: 'trial_welcome' },
        { delay: 1, template: 'trial_day1_tips' },
        { delay: 2, template: 'trial_ending_soon' },
        { delay: 3, template: 'trial_last_chance' }
      ],
      
      engagement: [
        { trigger: 'inactive_3_days', template: 'come_back' },
        { trigger: 'inactive_7_days', template: 'miss_you' },
        { trigger: 'inactive_14_days', template: 'special_offer' },
        { trigger: 'inactive_30_days', template: 'final_offer' }
      ],
      
      retention: [
        { trigger: 'payment_failed', template: 'payment_failed' },
        { trigger: 'cancelled', template: 'sorry_to_see_you_go' },
        { trigger: 'cancelled_7_days', template: 'win_back_offer' }
      ]
    };
  }

  // Send single email
  async sendEmail(to, template, data = {}) {
    try {
      const emailComponent = this.getEmailComponent(template, data);
      
      const result = await resend.emails.send({
        from: 'BossBuddy <hello@bossbuddy.ai>',
        to,
        subject: this.getSubjectLine(template, data),
        react: emailComponent,
        tags: [
          { name: 'template', value: template },
          { name: 'user_plan', value: data.plan || 'free' }
        ]
      });
      
      // Log email sent
      await supabase.from('email_logs').insert({
        user_email: to,
        template,
        sent_at: new Date(),
        resend_id: result.id
      });
      
      return result;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  // Get email component
  getEmailComponent(template, data) {
    const components = {
      welcome: <WelcomeEmail {...data} />,
      usage_report: <UsageReportEmail {...data} />,
      trial_ending: <TrialEndingEmail {...data} />,
      // Add more templates...
    };
    
    return components[template] || components.welcome;
  }

  // Get subject line
  getSubjectLine(template, data) {
    const subjects = {
      welcome: '🎉 Welcome to BossBuddy!',
      usage_report: `📊 Your Week: ${data.messagesRewritten || 0} Messages Perfected`,
      trial_ending: `⏰ Trial Ending in ${data.hoursLeft || 24} Hours`,
      tips_getting_started: '💡 5 Tips to Master BossBuddy',
      payment_failed: '⚠️ Payment Issue - Action Required',
      come_back: `${data.userName}, we miss you! 👋`,
      special_offer: '🎁 Exclusive 50% OFF - Just for You'
    };
    
    return subjects[template] || 'BossBuddy Update';
  }

  // Schedule sequence
  async scheduleSequence(userId, sequenceType) {
    const sequence = this.sequences[sequenceType];
    const user = await this.getUser(userId);
    
    for (const step of sequence) {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + step.delay);
      
      await supabase.from('email_queue').insert({
        user_id: userId,
        email: user.email,
        template: step.template,
        scheduled_for: scheduledFor,
        sequence_type: sequenceType,
        status: 'pending'
      });
    }
  }

  // Process email queue
  async processQueue() {
    const { data: emails } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(100);
      
    for (const email of emails) {
      try {
        const userData = await this.getUserData(email.user_id);
        await this.sendEmail(email.email, email.template, userData);
        
        // Mark as sent
        await supabase
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date() })
          .eq('id', email.id);
          
      } catch (error) {
        console.error(`Failed to send email ${email.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed', 
            error: error.message,
            retry_count: email.retry_count + 1
          })
          .eq('id', email.id);
      }
    }
  }

  // Get user data for email
  async getUserData(userId) {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    // Get usage stats
    const { data: stats } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      
    // Calculate metrics
    const messagesRewritten = stats?.length || 0;
    const savedMinutes = messagesRewritten * 3; // 3 min per message
    const toneUsage = stats?.reduce((acc, log) => {
      acc[log.tone] = (acc[log.tone] || 0) + 1;
      return acc;
    }, {});
    const popularTone = Object.entries(toneUsage || {})
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'formal';
      
    return {
      userName: user?.email?.split('@')[0] || 'there',
      email: user?.email,
      plan: user?.plan || 'free',
      messagesRewritten,
      savedMinutes,
      popularTone,
      weeklyStats: {
        messagesRewritten,
        toneUsage,
        plan: user?.plan
      }
    };
  }
}

// ===================================
// CRON JOBS
// ===================================

// app/api/cron/emails/route.ts
export async function GET(req) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const automation = new EmailAutomation();
  
  try {
    // Process email queue
    await automation.processQueue();
    
    // Send weekly reports (every Monday)
    if (new Date().getDay() === 1) {
      await sendWeeklyReports();
    }
    
    // Check for inactive users
    await checkInactiveUsers();
    
    // Check trial endings
    await checkTrialEndings();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Cron error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Send weekly usage reports
async function sendWeeklyReports() {
  const automation = new EmailAutomation();
  
  // Get all active users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .in('plan', ['pro', 'pro_plus'])
    .eq('email_preferences->weekly_report', true);
    
  for (const user of users) {
    const userData = await automation.getUserData(user.id);
    await automation.sendEmail(user.email, 'usage_report', userData);
  }
}

// Check for inactive users
async function checkInactiveUsers() {
  const automation = new EmailAutomation();
  
  const thresholds = [
    { days: 3, template: 'come_back' },
    { days: 7, template: 'miss_you' },
    { days: 14, template: 'special_offer' },
    { days: 30, template: 'final_offer' }
  ];
  
  for (const threshold of thresholds) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - threshold.days);
    
    const { data: inactiveUsers } = await supabase
      .from('users')
      .select('*')
      .lt('last_active', cutoffDate.toISOString())
      .eq(`email_sent->inactive_${threshold.days}_days`, false);
      
    for (const user of inactiveUsers) {
      await automation.sendEmail(user.email, threshold.template, {
        userName: user.email.split('@')[0],
        daysInactive: threshold.days
      });
      
      // Mark as sent
      await supabase
        .from('users')
        .update({ 
          [`email_sent->inactive_${threshold.days}_days`]: true 
        })
        .eq('id', user.id);
    }
  }
}

// Check trial endings
async function checkTrialEndings() {
  const automation = new EmailAutomation();
  
  // 24 hours before trial ends
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { data: endingTrials } = await supabase
    .from('subscriptions')
    .select('*, users!inner(*)')
    .eq('status', 'trialing')
    .gte('current_period_end', new Date().toISOString())
    .lte('current_period_end', tomorrow.toISOString());
    
  for (const trial of endingTrials) {
    const hoursLeft = Math.round(
      (new Date(trial.current_period_end) - new Date()) / (1000 * 60 * 60)
    );
    
    await automation.sendEmail(trial.users.email, 'trial_ending', {
      userName: trial.users.email.split('@')[0],
      hoursLeft
    });
  }
}

// ===================================
// EMAIL PREFERENCES API
// ===================================

// app/api/email-preferences/route.ts
export async function POST(req) {
  const { userId, preferences } = await req.json();
  
  await supabase
    .from('users')
    .update({ 
      email_preferences: preferences,
      updated_at: new Date()
    })
    .eq('id', userId);
    
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}