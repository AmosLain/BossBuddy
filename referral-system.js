// ===================================
// REFERRAL PROGRAM SYSTEM
// ===================================

/*
DATABASE SCHEMA for Referrals:

CREATE TABLE referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES users(id),
  referred_email VARCHAR(255),
  referred_id UUID REFERENCES users(id),
  referral_code VARCHAR(20) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, signed_up, converted, rewarded
  reward_type VARCHAR(20), -- free_month, cash, percentage
  reward_amount DECIMAL(10,2),
  referrer_rewarded BOOLEAN DEFAULT FALSE,
  referred_rewarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);

CREATE TABLE referral_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  referral_id UUID REFERENCES referrals(id),
  reward_type VARCHAR(20), -- subscription_credit, cash_payout, discount
  reward_value DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, applied, paid_out
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);
*/

// ===================================
// REFERRAL SERVICE
// ===================================

// services/referralService.js
import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Generate readable referral codes
const generateReferralCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export class ReferralProgram {
  constructor() {
    this.config = {
      // Reward structure
      rewards: {
        referrer: {
          type: 'subscription_credit',
          value: 1.99, // 1 month free
          threshold: 1, // After 1 successful conversion
          max_rewards: 12 // Max 1 year free
        },
        referred: {
          type: 'percentage_discount',
          value: 50, // 50% off first month
          duration: 1 // 1 month
        }
      },
      
      // Viral mechanics
      tiers: [
        { referrals: 3, bonus: 'extra_month' },
        { referrals: 5, bonus: 'pro_plus_upgrade' },
        { referrals: 10, bonus: 'lifetime_access' }
      ],
      
      // Tracking
      attribution_window: 30, // Days
      cookie_duration: 30 // Days
    };
  }

  // Create referral code for user
  async createReferralCode(userId) {
    // Check if user already has a code
    const { data: existing } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', userId)
      .single();
      
    if (existing?.referral_code) {
      return existing.referral_code;
    }
    
    // Generate unique code
    let code;
    let attempts = 0;
    
    do {
      code = generateReferralCode();
      const { data: duplicate } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', code)
        .single();
        
      if (!duplicate) break;
      attempts++;
    } while (attempts < 10);
    
    // Create referral entry
    await supabase.from('referrals').insert({
      referrer_id: userId,
      referral_code: code,
      status: 'active'
    });
    
    return code;
  }

  // Get user's referral stats
  async getReferralStats(userId) {
    // Get all referrals
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId);
      
    // Calculate stats
    const stats = {
      total_referrals: referrals?.length || 0,
      successful_referrals: referrals?.filter(r => r.status === 'converted').length || 0,
      pending_referrals: referrals?.filter(r => r.status === 'signed_up').length || 0,
      total_earned: 0,
      months_earned: 0,
      current_tier: 0,
      next_tier_progress: 0,
      referral_link: '',
      leaderboard_rank: 0
    };
    
    // Calculate earnings
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'applied');
      
    stats.total_earned = rewards?.reduce((sum, r) => sum + Number(r.reward_value), 0) || 0;
    stats.months_earned = Math.floor(stats.total_earned / 1.99);
    
    // Calculate tier
    const successfulCount = stats.successful_referrals;
    for (let i = this.config.tiers.length - 1; i >= 0; i--) {
      if (successfulCount >= this.config.tiers[i].referrals) {
        stats.current_tier = i + 1;
        break;
      }
    }
    
    // Next tier progress
    const nextTier = this.config.tiers[stats.current_tier];
    if (nextTier) {
      stats.next_tier_progress = (successfulCount / nextTier.referrals) * 100;
    }
    
    // Get referral code
    const { data: referralCode } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', userId)
      .single();
      
    stats.referral_link = `https://bossbuddy.ai?ref=${referralCode?.referral_code}`;
    
    // Calculate leaderboard rank
    stats.leaderboard_rank = await this.getLeaderboardRank(userId);
    
    return stats;
  }

  // Process referral signup
  async processReferralSignup(referralCode, newUserEmail, newUserId) {
    // Validate referral code
    const { data: referral } = await supabase
      .from('referrals')
      .select('*, users!referrer_id(*)')
      .eq('referral_code', referralCode)
      .single();
      
    if (!referral) {
      return { error: 'Invalid referral code' };
    }
    
    // Check if already referred
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_email', newUserEmail);
      
    if (existing?.length > 0) {
      return { error: 'Email already referred' };
    }
    
    // Create referral record
    const { data: newReferral } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referral.referrer_id,
        referred_email: newUserEmail,
        referred_id: newUserId,
        referral_code: referralCode,
        status: 'signed_up'
      })
      .select()
      .single();
      
    // Apply referred user discount
    await this.applyReferredDiscount(newUserId, newReferral.id);
    
    // Send notification to referrer
    await this.notifyReferrer(referral.users, newUserEmail);
    
    return { 
      success: true, 
      discount: this.config.rewards.referred.value,
      referral_id: newReferral.id
    };
  }

  // Process referral conversion (when referred user pays)
  async processReferralConversion(userId) {
    // Find referral record
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'signed_up')
      .single();
      
    if (!referral) return;
    
    // Update referral status
    await supabase
      .from('referrals')
      .update({
        status: 'converted',
        converted_at: new Date()
      })
      .eq('id', referral.id);
      
    // Create reward for referrer
    await this.createReferrerReward(referral.referrer_id, referral.id);
    
    // Check for tier bonuses
    await this.checkTierBonuses(referral.referrer_id);
    
    // Send success notifications
    await this.sendConversionNotifications(referral);
  }

  // Create referrer reward
  async createReferrerReward(referrerId, referralId) {
    const reward = this.config.rewards.referrer;
    
    // Check max rewards
    const { count } = await supabase
      .from('referral_rewards')
      .select('id', { count: 'exact' })
      .eq('user_id', referrerId)
      .eq('status', 'applied');
      
    if (count >= reward.max_rewards) {
      return { error: 'Max rewards reached' };
    }
    
    // Create reward
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12); // 1 year expiry
    
    await supabase.from('referral_rewards').insert({
      user_id: referrerId,
      referral_id: referralId,
      reward_type: reward.type,
      reward_value: reward.value,
      status: 'pending',
      expires_at: expiresAt
    });
    
    // Auto-apply to next billing
    await this.applyRewardToSubscription(referrerId);
  }

  // Apply reward to subscription
  async applyRewardToSubscription(userId) {
    // Get pending rewards
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at');
      
    if (!rewards?.length) return;
    
    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    if (!subscription) return;
    
    // Apply first reward
    const reward = rewards[0];
    
    // Extend subscription end date
    const newEndDate = new Date(subscription.current_period_end);
    newEndDate.setMonth(newEndDate.getMonth() + 1);
    
    await supabase
      .from('subscriptions')
      .update({
        current_period_end: newEndDate,
        credits_applied: (subscription.credits_applied || 0) + reward.reward_value
      })
      .eq('id', subscription.id);
      
    // Mark reward as applied
    await supabase
      .from('referral_rewards')
      .update({
        status: 'applied',
        applied_at: new Date()
      })
      .eq('id', reward.id);
  }

  // Check and apply tier bonuses
  async checkTierBonuses(userId) {
    const stats = await this.getReferralStats(userId);
    
    for (const tier of this.config.tiers) {
      if (stats.successful_referrals === tier.referrals) {
        await this.applyTierBonus(userId, tier);
      }
    }
  }

  // Get leaderboard
  async getLeaderboard(timeframe = 'all_time') {
    let query = supabase
      .from('referrals')
      .select('referrer_id, users!referrer_id(email, plan)')
      .eq('status', 'converted');
      
    // Apply timeframe filter
    if (timeframe === 'this_month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      query = query.gte('converted_at', startOfMonth.toISOString());
    }
    
    const { data } = await query;
    
    // Count referrals per user
    const leaderboard = {};
    data?.forEach(referral => {
      if (!leaderboard[referral.referrer_id]) {
        leaderboard[referral.referrer_id] = {
          user_id: referral.referrer_id,
          email: referral.users.email,
          plan: referral.users.plan,
          referrals: 0
        };
      }
      leaderboard[referral.referrer_id].referrals++;
    });
    
    // Sort and rank
    return Object.values(leaderboard)
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
  }
}

// ===================================
// REFERRAL UI COMPONENTS
// ===================================

// components/ReferralDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Gift, Users, TrendingUp, Copy, Share2, Mail, 
  Twitter, Facebook, Award, Target, DollarSign 
} from 'lucide-react';

export const ReferralDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  
  useEffect(() => {
    loadReferralData();
  }, [userId]);
  
  const loadReferralData = async () => {
    try {
      // Get user stats
      const statsRes = await fetch(`/api/referrals/stats?userId=${userId}`);
      const statsData = await statsRes.json();
      setStats(statsData);
      
      // Get leaderboard
      const leaderboardRes = await fetch('/api/referrals/leaderboard');
      const leaderboardData = await leaderboardRes.json();
      setLeaderboard(leaderboardData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading referral data:', error);
      setLoading(false);
    }
  };
  
  const copyReferralLink = () => {
    navigator.clipboard.writeText(stats.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareVia = (platform) => {
    const text = "I'm saving hours on work emails with BossBuddy! Get 50% off your first month:";
    const url = stats.referral_link;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=Check out BossBuddy&body=${encodeURIComponent(text + ' ' + url)}`
    };
    
    window.open(shareUrls[platform], '_blank');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-gray-600">
          Share BossBuddy and earn free months! Get 1 month free for each friend who subscribes.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold">{stats.total_referrals}</span>
          </div>
          <p className="text-gray-600">Total Referrals</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold">{stats.successful_referrals}</span>
          </div>
          <p className="text-gray-600">Successful</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold">{stats.months_earned}</span>
          </div>
          <p className="text-gray-600">Months Earned</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold">#{stats.leaderboard_rank || '-'}</span>
          </div>
          <p className="text-gray-600">Leaderboard Rank</p>
        </div>
      </div>
      
      {/* Referral Link */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={stats.referral_link}
            readOnly
            className="flex-1 px-4 py-3 bg-white rounded-lg border border-gray-300"
          />
          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Copy className="w-5 h-5" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        
        {/* Share Buttons */}
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-3">Share via:</p>
          <div className="flex gap-3">
            <button
              onClick={() => shareVia('twitter')}
              className="p-3 bg-[#1DA1F2] text-white rounded-lg hover:opacity-90"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVia('facebook')}
              className="p-3 bg-[#4267B2] text-white rounded-lg hover:opacity-90"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVia('linkedin')}
              className="p-3 bg-[#0077B5] text-white rounded-lg hover:opacity-90"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => shareVia('email')}
              className="p-3 bg-gray-600 text-white rounded-lg hover:opacity-90"
            >
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress to Next Tier */}
      {stats.current_tier < 3 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Progress to Next Reward Tier</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Tier {stats.current_tier + 1} Progress</span>
              <span>{stats.successful_referrals} / {getTierRequirement(stats.current_tier + 1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                style={{ width: `${stats.next_tier_progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {getTierReward(stats.current_tier + 1)}
          </p>
        </div>
      )}
      
      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">Referral Leaderboard</h3>
        <div className="space-y-3">
          {leaderboard.map((user) => (
            <div 
              key={user.user_id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                user.user_id === userId ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-500">#{user.rank}</span>
                <span className="font-medium">{user.email.split('@')[0]}</span>
              </div>
              <span className="font-bold">{user.referrals} referrals</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getTierRequirement = (tier) => {
  const requirements = { 1: 3, 2: 5, 3: 10 };
  return requirements[tier] || 0;
};

const getTierReward = (tier) => {
  const rewards = {
    1: "Unlock 3 bonus months!",
    2: "Get upgraded to Pro+ for free!",
    3: "Earn lifetime access to BossBuddy!"
  };
  return rewards[tier] || "";
};

// ===================================
// API ENDPOINTS
// ===================================

// app/api/referrals/create/route.js
export async function POST(req) {
  const { userId } = await req.json();
  const referralProgram = new ReferralProgram();
  
  try {
    const code = await referralProgram.createReferralCode(userId);
    return Response.json({ code, link: `https://bossbuddy.ai?ref=${code}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// app/api/referrals/stats/route.js
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  const referralProgram = new ReferralProgram();
  const stats = await referralProgram.getReferralStats(userId);
  
  return Response.json(stats);
}

// app/api/referrals/apply/route.js
export async function POST(req) {
  const { referralCode, email, userId } = await req.json();
  const referralProgram = new ReferralProgram();
  
  const result = await referralProgram.processReferralSignup(
    referralCode,
    email,
    userId
  );
  
  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  
  return Response.json(result);
}

// ===================================
// REFERRAL TRACKING MIDDLEWARE
// ===================================

// middleware.js
export function middleware(request) {
  const response = NextResponse.next();
  const url = new URL(request.url);
  
  // Track referral codes
  const ref = url.searchParams.get('ref');
  if (ref) {
    response.cookies.set('referral_code', ref, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
  }
  
  return response;
}

// ===================================
// EMAIL TEMPLATES FOR REFERRALS
// ===================================

// emails/ReferralSuccess.jsx
export const ReferralSuccessEmail = ({ referrerName, referredName, monthsEarned }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
    <div style={{ 
      background: 'linear-gradient(to right, #8B5CF6, #EC4899)', 
      padding: '40px 20px', 
      textAlign: 'center' 
    }}>
      <h1 style={{ color: 'white', margin: 0 }}>🎉 You Earned a Free Month!</h1>
    </div>
    
    <div style={{ padding: '30px 20px' }}>
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        Great news, {referrerName}!
      </p>
      
      <p style={{ lineHeight: '1.6', marginBottom: '20px' }}>
        Your friend {referredName} just subscribed to BossBuddy Pro using your referral link!
      </p>
      
      <div style={{ 
        background: '#F3E8FF', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#8B5CF6', margin: '0 0 10px 0' }}>
          You've Earned: {monthsEarned} Free Month{monthsEarned > 1 ? 's' : ''}
        </h2>
        <p style={{ margin: 0 }}>
          Automatically applied to your account
        </p>
      </div>
      
      <p style={{ marginBottom: '20px' }}>
        Keep sharing to earn more free months! There's no limit to how much you can earn.
      </p>
      
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <a href="https://bossbuddy.ai/referrals" style={{
          display: 'inline-block',
          padding: '15px 30px',
          background: '#8B5CF6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px'
        }}>
          View Your Referral Stats
        </a>
      </div>
    </div>
  </div>
);