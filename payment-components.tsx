import React, { useState, useEffect } from 'react';
import { Lock, CreditCard, Shield, Zap, Check, X, Globe, Coffee, DollarSign } from 'lucide-react';

// ===================================
// PAYPAL BUTTON COMPONENT
// ===================================

const PayPalButton = ({ plan, pricing, onSuccess, abVariant = 'gold' }) => {
  useEffect(() => {
    // Load PayPal SDK
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=${pricing.currency}`;
    script.async = true;
    script.onload = () => initPayPal();
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [pricing.currency]);
  
  const initPayPal = () => {
    window.paypal.Buttons({
      style: {
        shape: 'pill',
        color: abVariant, // 'gold', 'blue', or 'black' from A/B test
        layout: 'horizontal',
        label: 'subscribe'
      },
      createSubscription: (data, actions) => {
        return actions.subscription.create({
          plan_id: getPlanId(plan, pricing.currency),
          application_context: {
            brand_name: "BossBuddy",
            locale: getLocale(pricing.currency),
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW"
          }
        });
      },
      onApprove: async (data, actions) => {
        // Call backend to activate subscription
        const response = await fetch('/api/subscription/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: data.subscriptionID,
            plan
          })
        });
        
        if (response.ok) {
          onSuccess(data.subscriptionID);
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        alert('Payment failed. Please try again.');
      }
    }).render('#paypal-button-container');
  };
  
  return <div id="paypal-button-container" className="w-full" />;
};

// ===================================
// PADDLE BUTTON COMPONENT
// ===================================

const PaddleButton = ({ plan, pricing, onSuccess }) => {
  useEffect(() => {
    // Load Paddle SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/paddle.js';
    script.async = true;
    script.onload = () => {
      window.Paddle.Setup({ 
        vendor: parseInt(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID) 
      });
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  const openCheckout = () => {
    window.Paddle.Checkout.open({
      product: getPaddleProductId(plan, pricing.currency),
      email: userEmail,
      success: '/success',
      closeCallback: () => {
        console.log('Checkout closed');
      },
      successCallback: (data) => {
        onSuccess(data.checkout.id);
      }
    });
  };
  
  return (
    <button
      onClick={openCheckout}
      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
    >
      Pay with Card
    </button>
  );
};

// ===================================
// MAIN PAYMENT MODAL
// ===================================

const PaymentModal = ({ isOpen, onClose, userEmail, userId }) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState(null);
  const [abVariants, setAbVariants] = useState({});
  
  useEffect(() => {
    if (isOpen) {
      loadPricingAndTests();
    }
  }, [isOpen]);
  
  const loadPricingAndTests = async () => {
    // Get localized pricing
    const pricingRes = await fetch('/api/pricing');
    const pricingData = await pricingRes.json();
    setPricing(pricingData);
    
    // Get A/B test variants
    const tests = ['paymentOrder', 'pricingDisplay', 'buttonColor'];
    const variants = {};
    
    for (const test of tests) {
      const res = await fetch(`/api/ab-test/variant?userId=${userId}&test=${test}`);
      const data = await res.json();
      variants[test] = data.variant;
    }
    
    setAbVariants(variants);
    setLoading(false);
    
    // Set default payment method based on A/B test
    if (variants.paymentOrder === 'paypal_first') {
      setPaymentMethod('paypal');
    } else {
      setPaymentMethod('card');
    }
  };
  
  const handlePaymentSuccess = async (subscriptionId) => {
    // Track conversion
    await fetch('/api/ab-test/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tests: ['paymentOrder', 'pricingDisplay', 'buttonColor'],
        value: pricing.pricing[selectedPlan][billingCycle]
      })
    });
    
    // Redirect to success page
    window.location.href = `/welcome?plan=${selectedPlan}`;
  };
  
  const getPriceDisplay = () => {
    if (!pricing) return '';
    
    const price = pricing.pricing[selectedPlan][billingCycle];
    const symbol = pricing.pricing[selectedPlan].symbol;
    
    switch (abVariants.pricingDisplay) {
      case 'coffee_comparison':
        return (
          <div>
            <span className="text-3xl font-bold">{symbol}{price}</span>
            <span className="text-sm text-gray-600 block">Less than a coffee per month</span>
          </div>
        );
      case 'daily_cost':
        const dailyCost = (price / 30).toFixed(2);
        return (
          <div>
            <span className="text-3xl font-bold">{symbol}{price}</span>
            <span className="text-sm text-gray-600 block">Only {symbol}{dailyCost} per day</span>
          </div>
        );
      default:
        return <span className="text-3xl font-bold">{symbol}{price}/month</span>;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-3xl font-bold text-center mb-8">
          Choose Your Plan
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-full inline-flex">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full transition-all ${
                    billingCycle === 'monthly' 
                      ? 'bg-white shadow-md' 
                      : 'text-gray-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-full transition-all ${
                    billingCycle === 'yearly' 
                      ? 'bg-white shadow-md' 
                      : 'text-gray-600'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs text-green-600 font-semibold">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
            
            {/* Plan Selection */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Pro Plan */}
              <div
                onClick={() => setSelectedPlan('pro')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'pro' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                {getPriceDisplay()}
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Unlimited rewrites</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">12+ tones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Message history</span>
                  </li>
                </ul>
              </div>
              
              {/* Pro+ Plan */}
              <div
                onClick={() => setSelectedPlan('pro_plus')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedPlan === 'pro_plus' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">Pro+</h3>
                <div className="text-3xl font-bold">
                  {pricing.pricing.pro_plus.symbol}
                  {pricing.pricing.pro_plus[billingCycle]}
                </div>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Team sharing</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <PaymentMethodSelector
                methods={pricing.payment_methods}
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                abVariant={abVariants.paymentOrder}
              />
            </div>
            
            {/* Payment Button */}
            <div className="mb-6">
              {paymentMethod === 'paypal' ? (
                <PayPalButton
                  plan={selectedPlan}
                  pricing={pricing}
                  onSuccess={handlePaymentSuccess}
                  abVariant={abVariants.buttonColor}
                />
              ) : paymentMethod === 'card' ? (
                <PaddleButton
                  plan={selectedPlan}
                  pricing={pricing}
                  onSuccess={handlePaymentSuccess}
                />
              ) : null}
            </div>
            
            {/* Trust Badges */}
            <div className="flex justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Instant access</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ===================================
// PAYMENT METHOD SELECTOR
// ===================================

const PaymentMethodSelector = ({ methods, selected, onSelect, abVariant }) => {
  // Sort methods based on A/B test variant
  const sortedMethods = [...methods].sort((a, b) => {
    if (abVariant === 'paypal_first' && a.id === 'paypal') return -1;
    if (abVariant === 'card_first' && a.id === 'card') return -1;
    return b.popular - a.popular;
  });
  
  return (
    <div className="grid grid-cols-2 gap-3">
      {sortedMethods.map(method => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          disabled={!method.available}
          className={`p-4 rounded-xl border-2 transition-all ${
            selected === method.id
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {method.id === 'paypal' && (
            <img src="/paypal-logo.svg" alt="PayPal" className="h-6 mx-auto mb-2" />
          )}
          {method.id === 'card' && (
            <div className="flex justify-center gap-2 mb-2">
              <CreditCard className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <p className="text-sm font-medium">{method.name}</p>
          {method.popular && (
            <p className="text-xs text-green-600 mt-1">Popular in your region</p>
          )}
        </button>
      ))}
    </div>
  );
};

// ===================================
// SUBSCRIPTION MANAGEMENT
// ===================================

const SubscriptionManager = ({ user }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSubscription();
  }, []);
  
  const loadSubscription = async () => {
    const res = await fetch(`/api/subscription/status?userId=${user.id}`);
    const data = await res.json();
    setSubscription(data);
    setLoading(false);
  };
  
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        provider: subscription.provider
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      alert(`Subscription cancelled. You have access until ${new Date(data.endsAt).toLocaleDateString()}`);
      loadSubscription();
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  if (!subscription.hasAccess) {
    return (
      <div className="p-6 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
        <p className="text-gray-600 mb-4">Upgrade to unlock unlimited features</p>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          Upgrade to Pro
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {subscription.plan === 'pro_plus' ? 'Pro+' : 'Pro'} Plan
          </h3>
          <p className="text-gray-600">
            {subscription.cancel_at_period_end 
              ? `Access until ${new Date(subscription.expiresAt).toLocaleDateString()}`
              : `Renews ${new Date(subscription.expiresAt).toLocaleDateString()}`
            }
          </p>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
          Active
        </span>
      </div>
      
      {!subscription.cancel_at_period_end && (
        <button
          onClick={handleCancel}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel subscription
        </button>
      )}
    </div>
  );
};

// ===================================
// HELPER FUNCTIONS
// ===================================

const getPlanId = (plan, currency) => {
  const planIds = {
    pro: {
      USD: 'P-PRO-USD-199',
      EUR: 'P-PRO-EUR-179',
      GBP: 'P-PRO-GBP-159',
      ILS: 'P-PRO-ILS-699'
    },
    pro_plus: {
      USD: 'P-PLUS-USD-499',
      EUR: 'P-PLUS-EUR-449',
      GBP: 'P-PLUS-GBP-399',
      ILS: 'P-PLUS-ILS-1799'
    }
  };
  
  return planIds[plan]?.[currency] || planIds[plan].USD;
};

const getPaddleProductId = (plan, currency) => {
  const productIds = {
    pro: {
      USD: 12345,
      EUR: 12346,
      GBP: 12347,
      ILS: 12348
    },
    pro_plus: {
      USD: 12349,
      EUR: 12350,
      GBP: 12351,
      ILS: 12352
    }
  };
  
  return productIds[plan]?.[currency] || productIds[plan].USD;
};

const getLocale = (currency) => {
  const localeMap = {
    USD: 'en_US',
    EUR: 'en_DE',
    GBP: 'en_GB',
    ILS: 'he_IL',
    INR: 'en_IN',
    BRL: 'pt_BR'
  };
  
  return localeMap[currency] || 'en_US';
};

// Export main component
export default PaymentModal;