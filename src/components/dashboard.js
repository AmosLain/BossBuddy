// pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, getUser, getUserProfile, signOut, getTodayUsageCount } from '../lib/supabase';
import BossBuddy from '../components/BossBuddy';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      // Get current user
      const { user, error } = await getUser();
      
      if (error || !user) {
        router.push('/');
        return;
      }

      setUser(user);

      // Get user profile
      const { data: profileData } = await getUserProfile(user.id);
      setProfile(profileData);

      // Get today's usage
      const { count } = await getTodayUsageCount(user.id);
      setUsageCount(count);

      setLoading(false);
    };

    loadUserData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const updateUsageCount = async () => {
    const { count } = await getTodayUsageCount(user.id);
    setUsageCount(count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const dailyLimit = profile?.plan === 'premium' ? Infinity : 3;
  const remainingMessages = Math.max(0, dailyLimit - usageCount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BossBuddy Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Plan: <span className="font-semibold capitalize">{profile?.plan || 'free'}</span>
                </p>
                {profile?.plan !== 'premium' && (
                  <p className="text-sm text-gray-600">
                    Messages today: {usageCount}/{dailyLimit}
                  </p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Alert */}
        {profile?.plan !== 'premium' && remainingMessages === 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800">Daily limit reached</h3>
            <p className="text-sm text-yellow-700 mt-1">
              You've used all your free messages for today. Upgrade to Premium for unlimited rewrites!
            </p>
            <button className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition text-sm">
              Upgrade to Premium
            </button>
          </div>
        )}

        {/* BossBuddy Component */}
        <div className="bg-white rounded-lg shadow p-6">
          <BossBuddy 
            userId={user.id}
            userPlan={profile?.plan || 'free'}
            usageCount={usageCount}
            onRewrite={updateUsageCount}
          />
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Today's Usage</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{usageCount}</p>
            <p className="text-sm text-gray-600">messages rewritten</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Plan</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2 capitalize">{profile?.plan || 'free'}</p>
            <p className="text-sm text-gray-600">
              {profile?.plan === 'premium' ? 'Unlimited messages' : '3 messages/day'}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Member Since</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Welcome to BossBuddy!</p>
          </div>
        </div>
      </main>
    </div>
  );
}