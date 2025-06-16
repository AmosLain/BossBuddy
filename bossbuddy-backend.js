// ===================================
// 1. DATABASE SCHEMA (Supabase/PostgreSQL)
// ===================================

/*
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  plan VARCHAR(20) DEFAULT 'free',
  plan_expires_at TIMESTAMPTZ,
  paypal_subscription_id VARCHAR(255),
  paddle_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'USD',
  country VARCHAR(2),
  ab_test_group VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(20), -- 'paypal', 'paddle', 'stripe'
  provider_subscription_id VARCHAR(255),
  status VARCHAR(20), -- 'active', 'cancelled', 'past_due'
  plan VARCHAR(20), -- 'pro', 'pro_plus'
  currency VARCHAR(3),
  amount DECIMAL(10,2),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50),
  original_message TEXT,
  rewritten_message TEXT,
  tone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AB Test Results
CREATE TABLE ab_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  test_name VARCHAR(100),
  variant VARCHAR(50),
  converted BOOLEAN DEFAULT FALSE,
  conversion_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Events
CREATE TABLE payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(20),
  event_type VARCHAR(50),
  event_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

// ===================================
// 2. PAYPAL WEBHOOK HANDLER
// ===================================

// pages/api/webhooks/paypal.js
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Verify PayPal webhook signature
const verifyWebhookSignature = (headers, body, webhookId) => {
  const transmissionId = headers['paypal-transmission-id'];
  const timeStamp = headers['paypal-transmission-time'];
  const crc = parseInt("0x" + crypto.createHash('sha256')
    .update(body)
    .digest('hex'));
  
  const message = `${transmissionId}|${timeStamp}|${webhookId}|${crc}`;
  
  const expectedSig = crypto.createHash('sha256')
    .update(message)
    .digest('base64');
    
  return expectedSig === headers['paypal-transmission-sig'];
};

export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      req.headers,
      JSON.stringify(req.body),
      process.env.PAYPAL_WEBHOOK_ID
    );
    
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    
    // Log event for debugging
    await supabase.from('payment_events').insert({
      provider: 'paypal',
      event_type: event.event_type,
      event_data: event,
      processed: false
    });

    // Handle different event types
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(event);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    // Mark event as processed
    await supabase
      .from('payment_events')
      .update({ processed: true })
      .eq('event_data->id', event.id);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Handler functions
async function handleSubscriptionCreated(event) {
  const { resource } = event;
  const email = resource.subscriber.email_address;
  const subscriptionId = resource.id;
  
  // Create or update user
  const { data: user } = await supabase
    .from('users')
    .upsert({
      email,
      paypal_subscription_id: subscriptionId,
      plan: 'pro', // Will be activated after first payment
      updated_at: new Date()
    })
    .select()
    .single();
    
  // Create subscription record
  await supabase.from('subscriptions').insert({
    user_id: user.id,
    provider: 'paypal',
    provider_subscription_id: subscriptionId,
    status: 'pending',
    plan: getPlanFromPayPalPlanId(resource.plan_id),
    currency: resource.shipping_amount.currency_code,
    amount: resource.shipping_amount.value
  });
}

async function handleSubscriptionActivated(event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  
  // Update user to pro
  await supabase
    .from('users')
    .update({
      plan: 'pro',
      plan_expires_at: resource.billing_info.next_billing_time,
      updated_at: new Date()
    })
    .eq('paypal_subscription_id', subscriptionId);
    
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: resource.status_update_time,
      current_period_end: resource.billing_info.next_billing_time
    })
    .eq('provider_subscription_id', subscriptionId);
    
  // Send welcome email
  await sendEmail({
    to: resource.subscriber.email_address,
    subject: 'Welcome to BossBuddy Pro!',
    template: 'welcome-pro'
  });
}

async function handlePaymentCompleted(event) {
  const { resource } = event;
  
  // Extend subscription period
  if (resource.billing_agreement_id) {
    await supabase
      .from('subscriptions')
      .update({
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .eq('provider_subscription_id', resource.billing_agreement_id);
  }
}

async function handleSubscriptionCancelled(event) {
  const { resource } = event;
  const subscriptionId = resource.id;
  
  // Don't immediately downgrade - let them use until period ends
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true
    })
    .eq('provider_subscription_id', subscriptionId);
    
  // Send cancellation email
  await sendEmail({
    to: resource.subscriber.email_address,
    subject: 'We\'re sorry to see you go',
    template: 'cancellation'
  });
}

// ===================================
// 3. A/B TESTING FRAMEWORK
// ===================================

// utils/abTesting.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Define active tests
const ACTIVE_TESTS = {
  paymentOrder: {
    name: 'payment_button_order',
    variants: ['paypal_first', 'card_first', 'equal_weight'],
    weights: [0.33, 0.33, 0.34]
  },
  pricingDisplay: {
    name: 'pricing_display',
    variants: ['price_only', 'coffee_comparison', 'daily_cost'],
    weights: [0.33, 0.33, 0.34]
  },
  trialLength: {
    name: 'trial_length',
    variants: ['no_trial', '3_day_trial', '7_day_trial'],
    weights: [0.33, 0.33, 0.34]
  },
  buttonColor: {
    name: 'paypal_button_color',
    variants: ['gold', 'blue', 'black'],
    weights: [0.33, 0.33, 0.34]
  }
};

// Get user's test variant
export const getABTestVariant = async (userId, testName) => {
  // Check if user already has a variant
  const { data: existing } = await supabase
    .from('ab_tests')
    .select('variant')
    .eq('user_id', userId)
    .eq('test_name', testName)
    .single();
    
  if (existing) {
    return existing.variant;
  }
  
  // Assign new variant
  const test = ACTIVE_TESTS[testName];
  const random = Math.random();
  let cumulativeWeight = 0;
  let selectedVariant = test.variants[0];
  
  for (let i = 0; i < test.variants.length; i++) {
    cumulativeWeight += test.weights[i];
    if (random <= cumulativeWeight) {
      selectedVariant = test.variants[i];
      break;
    }
  }
  
  // Save assignment
  await supabase.from('ab_tests').insert({
    user_id: userId,
    test_name: test.name,
    variant: selectedVariant
  });
  
  return selectedVariant;
};

// Track conversion
export const trackABConversion = async (userId, testName, value = null) => {
  await supabase
    .from('ab_tests')
    .update({
      converted: true,
      conversion_value: value
    })
    .eq('user_id', userId)
    .eq('test_name', testName);
};

// Component: A/B Tested Payment Buttons
export const ABTestedPaymentButtons = ({ userId, onSelect }) => {
  const [variant, setVariant] = useState('paypal_first');
  const [priceVariant, setPriceVariant] = useState('price_only');
  
  useEffect(() => {
    const loadVariants = async () => {
      const paymentVariant = await getABTestVariant(userId, 'paymentOrder');
      const priceV = await getABTestVariant(userId, 'pricingDisplay');
      setVariant(paymentVariant);
      setPriceVariant(priceV);
    };
    loadVariants();
  }, [userId]);
  
  const getPriceDisplay = () => {
    switch (priceVariant) {
      case 'coffee_comparison':
        return '$1.99/mo (less than a coffee)';
      case 'daily_cost':
        return '$1.99/mo (only $0.06/day)';
      default:
        return '$1.99/month';
    }
  };
  
  const buttons = {
    paypal: (
      <button
        key="paypal"
        onClick={() => onSelect('paypal')}
        className="flex-1 p-4 border-2 rounded-xl hover:border-blue-500"
      >
        <img src="/paypal.svg" alt="PayPal" className="h-8 mx-auto" />
        <p className="text-sm mt-2">{getPriceDisplay()}</p>
      </button>
    ),
    card: (
      <button
        key="card"
        onClick={() => onSelect('card')}
        className="flex-1 p-4 border-2 rounded-xl hover:border-blue-500"
      >
        <div className="flex justify-center gap-2">
          <img src="/visa.svg" alt="Visa" className="h-6" />
          <img src="/mastercard.svg" alt="MC" className="h-6" />
        </div>
        <p className="text-sm mt-2">{getPriceDisplay()}</p>
      </button>
    )
  };
  
  const buttonOrder = variant === 'paypal_first' 
    ? [buttons.paypal, buttons.card]
    : variant === 'card_first'
    ? [buttons.card, buttons.paypal]
    : [buttons.paypal, buttons.card];
    
  return (
    <div className="grid grid-cols-2 gap-3">
      {buttonOrder}
    </div>
  );
};

// ===================================
// 4. CURRENCY DETECTION & PRICING
// ===================================

// utils/pricing.js
const PRICING = {
  USD: { pro: 1.99, pro_plus: 4.99, symbol: '$' },
  EUR: { pro: 1.79, pro_plus: 4.49, symbol: '€' },
  GBP: { pro: 1.59, pro_plus: 3.99, symbol: '£' },
  ILS: { pro: 6.99, pro_plus: 17.99, symbol: '₪' },
  CAD: { pro: 2.49, pro_plus: 5.99, symbol: 'C$' },
  AUD: { pro: 2.99, pro_plus: 6.99, symbol: 'A$' },
  INR: { pro: 149, pro_plus: 399, symbol: '₹' },
  BRL: { pro: 9.99, pro_plus: 24.99, symbol: 'R$' }
};

// Detect user's country and currency
export const detectUserLocation = async (req) => {
  // Try to get from Cloudflare/Vercel headers
  const country = req.headers['cf-ipcountry'] || 
                 req.headers['x-vercel-ip-country'] ||
                 'US';
                 
  // Map country to currency
  const currencyMap = {
    US: 'USD', CA: 'USD', MX: 'USD',
    GB: 'GBP', UK: 'GBP',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
    IL: 'ILS',
    IN: 'INR',
    BR: 'BRL',
    AU: 'AUD', NZ: 'AUD',
    // Default to USD for others
  };
  
  const currency = currencyMap[country] || 'USD';
  
  return { country, currency };
};

// Get localized pricing
export const getLocalizedPricing = (currency = 'USD') => {
  const prices = PRICING[currency] || PRICING.USD;
  
  return {
    currency,
    pro: {
      monthly: prices.pro,
      yearly: Math.round(prices.pro * 10), // ~20% discount
      display: `${prices.symbol}${prices.pro}`,
      yearlyDisplay: `${prices.symbol}${Math.round(prices.pro * 10)}`
    },
    pro_plus: {
      monthly: prices.pro_plus,
      yearly: Math.round(prices.pro_plus * 10),
      display: `${prices.symbol}${prices.pro_plus}`,
      yearlyDisplay: `${prices.symbol}${Math.round(prices.pro_plus * 10)}`
    }
  };
};

// API endpoint for pricing
// pages/api/pricing.js
export default async function handler(req, res) {
  const { country, currency } = await detectUserLocation(req);
  const pricing = getLocalizedPricing(currency);
  
  res.json({
    country,
    currency,
    pricing,
    payment_methods: getAvailablePaymentMethods(country)
  });
}

// Get available payment methods by country
const getAvailablePaymentMethods = (country) => {
  const methods = [
    {
      id: 'paypal',
      name: 'PayPal',
      available: true,
      popular: ['IL', 'DE', 'BR'].includes(country)
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      available: true,
      popular: ['US', 'GB', 'CA'].includes(country)
    }
  ];
  
  // Add local payment methods
  if (country === 'IL') {
    methods.push({
      id: 'tranzila',
      name: 'Israeli Card (₪)',
      available: true,
      popular: true
    });
  }
  
  if (country === 'BR') {
    methods.push({
      id: 'pix',
      name: 'PIX',
      available: true,
      popular: true
    });
  }
  
  return methods.sort((a, b) => b.popular - a.popular);
};

// ===================================
// 5. SUBSCRIPTION MANAGEMENT
// ===================================

// utils/subscription.js
export class SubscriptionManager {
  constructor(supabase) {
    this.supabase = supabase;
  }
  
  // Check if user has active subscription
  async checkSubscription(userId) {
    const { data: user } = await this.supabase
      .from('users')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .single();
      
    if (!user) return { hasAccess: false, plan: 'free' };
    
    // Check if plan is still valid
    if (user.plan !== 'free' && user.plan_expires_at) {
      const expiresAt = new Date(user.plan_expires_at);
      if (expiresAt < new Date()) {
        // Subscription expired, downgrade
        await this.downgradeUser(userId);
        return { hasAccess: false, plan: 'free' };
      }
    }
    
    return {
      hasAccess: user.plan !== 'free',
      plan: user.plan,
      expiresAt: user.plan_expires_at
    };
  }
  
  // Upgrade user
  async upgradeUser(userId, plan, provider, subscriptionId) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    await this.supabase
      .from('users')
      .update({
        plan,
        plan_expires_at: expiresAt,
        [`${provider}_subscription_id`]: subscriptionId,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    // Log the upgrade
    await this.logUsage(userId, 'subscription_upgraded', { plan, provider });
  }
  
  // Downgrade user
  async downgradeUser(userId) {
    await this.supabase
      .from('users')
      .update({
        plan: 'free',
        plan_expires_at: null,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    await this.logUsage(userId, 'subscription_downgraded');
  }
  
  // Cancel subscription
  async cancelSubscription(userId, provider) {
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active')
      .single();
      
    if (!subscription) return { error: 'No active subscription found' };
    
    // Call provider's cancel API
    switch (provider) {
      case 'paypal':
        await cancelPayPalSubscription(subscription.provider_subscription_id);
        break;
      case 'paddle':
        await cancelPaddleSubscription(subscription.provider_subscription_id);
        break;
    }
    
    // Mark as cancelled but keep access until period ends
    await this.supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true
      })
      .eq('id', subscription.id);
      
    return { success: true, endsAt: subscription.current_period_end };
  }
  
  // Log usage
  async logUsage(userId, action, data = {}) {
    await this.supabase.from('usage_logs').insert({
      user_id: userId,
      action,
      ...data
    });
  }
  
  // Get usage stats
  async getUsageStats(userId, period = 'month') {
    const since = new Date();
    if (period === 'month') since.setMonth(since.getMonth() - 1);
    else if (period === 'week') since.setDate(since.getDate() - 7);
    else if (period === 'day') since.setDate(since.getDate() - 1);
    
    const { data, count } = await this.supabase
      .from('usage_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());
      
    return {
      total: count,
      period,
      logs: data
    };
  }
}

// ===================================
// 6. API ENDPOINTS
// ===================================

// pages/api/subscription/status.js
export default async function handler(req, res) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const manager = new SubscriptionManager(supabase);
  const status = await manager.checkSubscription(userId);
  
  res.json(status);
}

// pages/api/subscription/cancel.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { userId, provider } = req.body;
  
  const manager = new SubscriptionManager(supabase);
  const result = await manager.cancelSubscription(userId, provider);
  
  if (result.error) {
    return res.status(400).json(result);
  }
  
  res.json(result);
}

// pages/api/subscription/usage.js
export default async function handler(req, res) {
  const { userId, period = 'month' } = req.query;
  
  const manager = new SubscriptionManager(supabase);
  const stats = await manager.getUsageStats(userId, period);
  
  res.json(stats);
}

// ===================================
// 7. CRON JOBS
// ===================================

// pages/api/cron/check-subscriptions.js
// Run daily to check expired subscriptions
export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Find expired subscriptions
  const { data: expired } = await supabase
    .from('users')
    .select('id, email, plan')
    .lt('plan_expires_at', new Date().toISOString())
    .neq('plan', 'free');
    
  // Downgrade expired users
  for (const user of expired) {
    const manager = new SubscriptionManager(supabase);
    await manager.downgradeUser(user.id);
    
    // Send expiration email
    await sendEmail({
      to: user.email,
      subject: 'Your BossBuddy Pro subscription has expired',
      template: 'subscription-expired'
    });
  }
  
  res.json({ processed: expired.length });
}

// ===================================
// 8. FRONTEND HOOKS
// ===================================

// hooks/useSubscription.js
import { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';

export const useSubscription = () => {
  const user = useUser();
  const [subscription, setSubscription] = useState({
    loading: true,
    hasAccess: false,
    plan: 'free',
    expiresAt: null
  });
  
  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);
  
  const checkSubscription = async () => {
    const res = await fetch(`/api/subscription/status?userId=${user.id}`);
    const data = await res.json();
    setSubscription({ ...data, loading: false });
  };
  
  const cancelSubscription = async (provider) => {
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, provider })
    });
    
    if (res.ok) {
      await checkSubscription();
    }
    
    return res.json();
  };
  
  return {
    ...subscription,
    refresh: checkSubscription,
    cancel: cancelSubscription
  };
};

// ===================================
// 9. PAYMENT PROCESSOR HELPERS
// ===================================

// utils/paypal.js
const cancelPayPalSubscription = async (subscriptionId) => {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  
  const response = await fetch(
    `${process.env.PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: 'Customer requested cancellation'
      })
    }
  );
  
  return response.ok;
};

// utils/paddle.js
const cancelPaddleSubscription = async (subscriptionId) => {
  const response = await fetch('https://vendors.paddle.com/api/2.0/subscription/users_cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      vendor_id: process.env.PADDLE_VENDOR_ID,
      vendor_auth_code: process.env.PADDLE_AUTH_CODE,
      subscription_id: subscriptionId
    })
  });
  
  return response.ok;
};

// ===================================
// 10. ENVIRONMENT VARIABLES
// ===================================

/*
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_API_URL=https://api-m.paypal.com

# Paddle
PADDLE_VENDOR_ID=
PADDLE_AUTH_CODE=
NEXT_PUBLIC_PADDLE_VENDOR_ID=

# Other
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://bossbuddy.ai
*/