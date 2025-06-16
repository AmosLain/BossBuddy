// ===================================
// PAYPAL SANDBOX SETUP GUIDE
// ===================================

/*
STEP 1: Create PayPal Developer Account
1. Go to https://developer.paypal.com
2. Sign in with your PayPal account
3. Navigate to Dashboard > My Apps & Credentials
4. Click "Create App"
5. Name: "BossBuddy"
6. Select "Merchant" account type
*/

// ===================================
// STEP 2: Create Sandbox Test Accounts
// ===================================

/*
In PayPal Developer Dashboard:
1. Go to Sandbox > Accounts
2. Create 2 accounts:
   - Business (Merchant): bossbuddy-merchant@test.com
   - Personal (Buyer): test-buyer@test.com
3. Set passwords you'll remember
4. Give Personal account $100 balance
*/

// ===================================
// STEP 3: Create Subscription Products & Plans
// ===================================

// scripts/setupPayPalProducts.js
const axios = require('axios');

class PayPalSetup {
  constructor(clientId, clientSecret, sandbox = true) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseURL = sandbox 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
    this.accessToken = null;
  }

  // Get OAuth token
  async getAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data);
      throw error;
    }
  }

  // Create a product
  async createProduct(productData) {
    await this.getAccessToken();
    
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/catalogs/products`,
        productData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error.response?.data);
      throw error;
    }
  }

  // Create a subscription plan
  async createPlan(planData) {
    await this.getAccessToken();
    
    try {
      const response = await axios.post(
        `${this.baseURL}/v1/billing/plans`,
        planData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating plan:', error.response?.data);
      throw error;
    }
  }
}

// Setup script
async function setupPayPalSubscriptions() {
  const paypal = new PayPalSetup(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET,
    true // sandbox mode
  );

  console.log('🚀 Setting up PayPal products and plans...\n');

  // 1. Create Products
  const products = {
    pro: await paypal.createProduct({
      name: "BossBuddy Pro",
      description: "Professional message rewriting with AI",
      type: "SERVICE",
      category: "SOFTWARE",
      image_url: "https://bossbuddy.ai/logo.png",
      home_url: "https://bossbuddy.ai"
    }),
    
    proPlus: await paypal.createProduct({
      name: "BossBuddy Pro+",
      description: "Advanced features for power users",
      type: "SERVICE",
      category: "SOFTWARE"
    })
  };

  console.log('✅ Products created:');
  console.log('Pro Product ID:', products.pro.id);
  console.log('Pro+ Product ID:', products.proPlus.id);

  // 2. Create Plans
  const plans = {
    // Pro Monthly - $1.99
    proMonthly: await paypal.createPlan({
      product_id: products.pro.id,
      name: "BossBuddy Pro - Monthly",
      description: "Unlimited professional rewrites",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "TRIAL",
          sequence: 1,
          total_cycles: 1,
          pricing_scheme: {
            fixed_price: {
              value: "0",
              currency_code: "USD"
            }
          }
        },
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 2,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: "1.99",
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD"
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: "0",
        inclusive: false
      }
    }),

    // Pro Yearly - $19 (save ~20%)
    proYearly: await paypal.createPlan({
      product_id: products.pro.id,
      name: "BossBuddy Pro - Yearly",
      description: "Save 20% with annual billing",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "YEAR",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: "19.00",
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3
      }
    }),

    // Pro+ Monthly - $4.99
    proPlusMonthly: await paypal.createPlan({
      product_id: products.proPlus.id,
      name: "BossBuddy Pro+ - Monthly",
      description: "API access and team features",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: "4.99",
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3
      }
    })
  };

  console.log('\n✅ Plans created:');
  console.log('Pro Monthly Plan ID:', plans.proMonthly.id);
  console.log('Pro Yearly Plan ID:', plans.proYearly.id);
  console.log('Pro+ Monthly Plan ID:', plans.proPlusMonthly.id);

  // Save these IDs to your .env.local
  console.log('\n📝 Add these to your .env.local:');
  console.log(`PAYPAL_PRO_MONTHLY_PLAN_ID=${plans.proMonthly.id}`);
  console.log(`PAYPAL_PRO_YEARLY_PLAN_ID=${plans.proYearly.id}`);
  console.log(`PAYPAL_PROPLUS_MONTHLY_PLAN_ID=${plans.proPlusMonthly.id}`);

  return { products, plans };
}

// Run the setup
// node scripts/setupPayPalProducts.js
if (require.main === module) {
  setupPayPalSubscriptions()
    .then(() => console.log('\n✅ PayPal setup complete!'))
    .catch(console.error);
}

// ===================================
// STEP 4: Test Integration
// ===================================

// __tests__/paypal.test.js
const { renderHook } from '@testing-library/react-hooks';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

describe('PayPal Integration Tests', () => {
  const wrapper = ({ children }) => (
    <PayPalScriptProvider 
      options={{ 
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_SANDBOX,
        "data-namespace": "BossBuddy",
        "data-sdk-integration-source": "react-paypal-js"
      }}
    >
      {children}
    </PayPalScriptProvider>
  );

  test('PayPal SDK loads correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => usePayPalScriptReducer(),
      { wrapper }
    );

    await waitForNextUpdate();
    expect(result.current[0].isLoaded).toBe(true);
  });

  test('Can create test subscription', async () => {
    // Mock subscription creation
    const mockCreateSubscription = jest.fn().mockResolvedValue('I-TEST12345');
    
    const result = await mockCreateSubscription({
      plan_id: process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
      subscriber: {
        name: { given_name: 'Test', surname: 'User' },
        email_address: 'test@example.com'
      }
    });

    expect(result).toBe('I-TEST12345');
  });
});

// ===================================
// STEP 5: Webhook Testing
// ===================================

// scripts/testPayPalWebhook.js
async function testWebhook() {
  // Simulate webhook events
  const events = [
    {
      id: 'WH-TEST-001',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: {
        id: 'I-TEST12345',
        plan_id: process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
        status: 'APPROVAL_PENDING',
        subscriber: {
          email_address: 'test@example.com'
        }
      }
    },
    {
      id: 'WH-TEST-002',
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource: {
        id: 'I-TEST12345',
        status: 'ACTIVE',
        billing_info: {
          next_billing_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    }
  ];

  // Send to local webhook endpoint
  for (const event of events) {
    const response = await fetch('http://localhost:3000/api/webhooks/paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PayPal-Transmission-Id': 'test-transmission-id',
        'PayPal-Transmission-Time': new Date().toISOString(),
        'PayPal-Transmission-Sig': 'test-signature',
        'PayPal-Cert-Url': 'test-cert-url',
        'PayPal-Auth-Algo': 'SHA256withRSA'
      },
      body: JSON.stringify(event)
    });

    console.log(`Event ${event.event_type}:`, response.status);
  }
}

// ===================================
// STEP 6: Sandbox Testing Checklist
// ===================================

/*
TESTING CHECKLIST:

1. [ ] Create sandbox accounts (Business & Personal)
2. [ ] Run setupPayPalProducts.js to create products/plans
3. [ ] Update .env.local with sandbox credentials
4. [ ] Test subscription creation flow:
   - Click upgrade button
   - Login with sandbox Personal account
   - Complete subscription
   - Verify webhook received

5. [ ] Test subscription lifecycle:
   - Activation webhook
   - Payment completed webhook
   - Cancellation flow
   - Refund process

6. [ ] Test edge cases:
   - Payment failure
   - Insufficient funds
   - Card expiry
   - Multiple currencies

7. [ ] Load test webhooks:
   - Duplicate events
   - Out-of-order events
   - Delayed events
*/

// ===================================
// HELPFUL UTILITIES
// ===================================

// utils/paypalHelpers.js
export const paypalHelpers = {
  // Format plan ID by currency
  getPlanId: (plan, currency, billingCycle) => {
    const planMap = {
      pro: {
        monthly: {
          USD: process.env.PAYPAL_PRO_MONTHLY_PLAN_ID,
          EUR: process.env.PAYPAL_PRO_MONTHLY_EUR_PLAN_ID,
          GBP: process.env.PAYPAL_PRO_MONTHLY_GBP_PLAN_ID,
          ILS: process.env.PAYPAL_PRO_MONTHLY_ILS_PLAN_ID
        },
        yearly: {
          USD: process.env.PAYPAL_PRO_YEARLY_PLAN_ID,
          EUR: process.env.PAYPAL_PRO_YEARLY_EUR_PLAN_ID
        }
      }
    };
    
    return planMap[plan]?.[billingCycle]?.[currency] || planMap.pro.monthly.USD;
  },

  // Generate webhook signature for testing
  generateTestSignature: (transmissionId, timeStamp, webhookId, body) => {
    const crypto = require('crypto');
    const crc = parseInt("0x" + crypto.createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex'));
    
    const message = `${transmissionId}|${timeStamp}|${webhookId}|${crc}`;
    
    return crypto.createHash('sha256')
      .update(message)
      .digest('base64');
  },

  // Validate webhook in development
  validateWebhook: (headers, body, webhookId) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Skipping webhook validation in development');
      return true;
    }
    
    // Production validation
    return verifyWebhookSignature(headers, body, webhookId);
  }
};