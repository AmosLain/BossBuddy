import React, { useState, useEffect } from 'react';
import { Send, Copy, Download, Sun, Moon, Sparkles, Mail, ChevronRight, Check, Briefcase, MessageSquare, Zap, Shield, Clock, TrendingUp, Users, Star, Lock, Unlock, History, FileText, Globe, BarChart3, ArrowRight, X } from 'lucide-react';

const BossBuddy = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('formal');
  const [rewrittenMessage, setRewrittenMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailGate, setShowEmailGate] = useState(true);
  const [copied, setCopied] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [messageHistory, setMessageHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  
  const FREE_LIMIT = 3;
  const TOTAL_USERS = 2847;
  const MESSAGES_TODAY = 12453;
  
  const TONES = {
    free: [
      { id: 'formal', name: 'Formal', icon: '👔' },
      { id: 'friendly', name: 'Friendly', icon: '😊' },
      { id: 'assertive', name: 'Assertive', icon: '💪' },
      { id: 'apologetic', name: 'Apologetic', icon: '🙏' }
    ],
    pro: [
      { id: 'urgent', name: 'Urgent', icon: '🚨' },
      { id: 'diplomatic', name: 'Diplomatic', icon: '🤝' },
      { id: 'casual', name: 'Casual', icon: '😎' },
      { id: 'confident', name: 'Confident', icon: '✨' },
      { id: 'empathetic', name: 'Empathetic', icon: '❤️' },
      { id: 'direct', name: 'Direct', icon: '🎯' },
      { id: 'collaborative', name: 'Collaborative', icon: '🤜🤛' },
      { id: 'grateful', name: 'Grateful', icon: '🙌' }
    ]
  };
  
  const QUICK_TEMPLATES = [
    { id: 'sick', text: "I'm not feeling well and need to take a sick day", icon: '🤒', category: 'Time Off' },
    { id: 'late', text: "I'm running late due to traffic", icon: '🚗', category: 'Attendance' },
    { id: 'pto', text: "I'd like to request time off next week", icon: '🏖️', category: 'Time Off' },
    { id: 'meeting', text: "Can we reschedule our meeting?", icon: '📅', category: 'Meetings' },
    { id: 'deadline', text: "I need more time to complete this project", icon: '⏰', category: 'Deadlines' },
    { id: 'help', text: "I need help with this task", icon: '🆘', category: 'Support' }
  ];

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Load saved data
    const saved = localStorage.getItem('bossbuddy_data');
    if (saved) {
      const data = JSON.parse(saved);
      setDailyUsage(data.dailyUsage || 0);
      setMessageHistory(data.history || []);
      setEmailSubmitted(data.emailSubmitted || false);
      setEmail(data.email || '');
      
      // Reset daily usage if new day
      const lastUsed = new Date(data.lastUsed || Date.now());
      const today = new Date();
      if (lastUsed.toDateString() !== today.toDateString()) {
        setDailyUsage(0);
      }
    }
  }, []);

  const saveData = () => {
    localStorage.setItem('bossbuddy_data', JSON.stringify({
      dailyUsage,
      history: messageHistory,
      emailSubmitted,
      email,
      lastUsed: Date.now()
    }));
  };

  const trackEvent = (eventName, properties = {}) => {
    // Analytics tracking - integrate with Mixpanel/Posthog
    console.log('Track:', eventName, properties);
  };

  const handleSubmit = () => {
    if (!message) return;
    
    // Check usage limits for free users
    if (userPlan === 'free' && dailyUsage >= FREE_LIMIT && !emailSubmitted) {
      setShowPricing(true);
      trackEvent('hit_free_limit');
      return;
    }
    
    setLoading(true);
    trackEvent('message_rewritten', { tone, length: message.length });
    
    // Simulate API call
    setTimeout(() => {
      const templates = {
        formal: `Dear [Boss Name],

I hope this message finds you well. I am writing to inform you that ${message.toLowerCase()}.

I apologize for any inconvenience this may cause and will ensure that all urgent matters are addressed appropriately. Please let me know if you need any additional information or if there are specific tasks that require immediate attention.

Thank you for your understanding and consideration.

Best regards,
[Your Name]`,
        friendly: `Hi [Boss Name],

Hope you're doing well! I wanted to reach out because ${message.toLowerCase()}.

I'll make sure everything stays on track and will keep you updated. Let me know if you need anything from me or if there's anything specific I should prioritize.

Thanks so much for being understanding!

Best,
[Your Name]`,
        assertive: `Hello [Boss Name],

I am informing you that ${message.toLowerCase()}.

I have taken the necessary steps to ensure minimal disruption to our workflow. My current projects are at a stable point, and I've documented any critical information for the team.

I will address any accumulated items upon my return.

Regards,
[Your Name]`,
        apologetic: `Dear [Boss Name],

I sincerely apologize for any inconvenience, but ${message.toLowerCase()}.

I understand this may cause disruption and I deeply regret the timing. I've done everything possible to minimize the impact, including preparing detailed handover notes and briefing team members on urgent matters.

Thank you for your patience and understanding during this time.

Sincerely,
[Your Name]`,
        urgent: `URGENT: ${message}

[Boss Name], this requires immediate attention. I've already begun addressing the situation and will keep you updated on progress.

Next steps:
1. [Immediate action taken]
2. [Short-term solution]
3. [Long-term resolution]

Available for discussion at your earliest convenience.`,
        diplomatic: `Dear [Boss Name],

I hope this message finds you at a convenient time. I wanted to discuss that ${message.toLowerCase()}.

I believe we can work together to find a solution that works for everyone involved. I'm open to exploring alternatives and would value your input on the best path forward.

Would you be available for a brief discussion at your convenience?

Warm regards,
[Your Name]`
      };
      
      const result = templates[tone] || templates.formal;
      setRewrittenMessage(result);
      setLoading(false);
      setShowComparison(true);
      
      // Update usage and history
      const newUsage = dailyUsage + 1;
      setDailyUsage(newUsage);
      
      const historyItem = {
        id: Date.now(),
        original: message,
        rewritten: result,
        tone,
        date: new Date().toISOString()
      };
      
      const newHistory = [historyItem, ...messageHistory].slice(0, 50);
      setMessageHistory(newHistory);
      
      saveData();
    }, 1500);
  };

  const handleEmailSubmit = () => {
    if (email) {
      setEmailSubmitted(true);
      trackEvent('email_submitted', { email });
      saveData();
      handleSubmit();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rewrittenMessage);
    setCopied(true);
    trackEvent('message_copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsPDF = () => {
    trackEvent('message_downloaded');
    const element = document.createElement('a');
    const content = userPlan === 'free' 
      ? rewrittenMessage + '\n\n---\nCreated with BossBuddy.ai'
      : rewrittenMessage;
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'professional-message.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetForm = () => {
    setMessage('');
    setRewrittenMessage('');
    setSelectedTemplate(null);
    setShowComparison(false);
  };

  const selectTemplate = (template) => {
    setMessage(template.text);
    setSelectedTemplate(template.id);
    trackEvent('template_selected', { template: template.id });
  };

  const PricingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full p-8 relative">
        <button
          onClick={() => setShowPricing(false)}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Upgrade to Pro
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">Free</h3>
            <p className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal">/month</span></p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>3 rewrites per day</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>4 basic tones</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">Message history</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">Priority support</span>
              </li>
            </ul>
            <button className="w-full py-3 border-2 border-gray-300 rounded-xl font-semibold">
              Current Plan
            </button>
          </div>
          
          {/* Pro Plan */}
          <div className="border-2 border-purple-500 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              MOST POPULAR
            </div>
            <h3 className="text-xl font-bold mb-4">Pro</h3>
            <div className="mb-6">
              <p className="text-3xl font-bold">$1.99<span className="text-sm font-normal">/month</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">or $19/year (save 20%)</p>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Unlimited rewrites</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>12+ professional tones</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Message history (last 100)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Priority AI processing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No watermarks</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Email templates</span>
              </li>
            </ul>
            <button 
              onClick={() => {
                trackEvent('upgrade_clicked', { plan: 'pro' });
                alert('Stripe checkout would open here');
              }}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Start Free Trial
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">Less than a coffee per month!</p>
          </div>
        </div>
        
        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
          <Lock className="w-4 h-4 inline mr-1" />
          Secure payment via Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );

  if (currentPage === 'landing') {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
        <div className="relative overflow-hidden">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>

          {/* Hero Section */}
          <div className="container mx-auto px-6 pt-20 pb-24">
            <div className="text-center max-w-5xl mx-auto">
              {/* Social Proof Banner */}
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full mb-8">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white dark:border-gray-800" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {TOTAL_USERS.toLocaleString()} professionals use BossBuddy
                </span>
              </div>
              
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl transform hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                Never Stress About<br />Work Messages Again
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                Transform casual thoughts into professional communications in seconds.
                <br />
                <span className="text-lg text-gray-600 dark:text-gray-400">
                  AI-powered. Boss-approved. Career-changing.
                </span>
              </p>
              
              {/* Stats */}
              <div className="flex justify-center gap-8 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{MESSAGES_TODAY.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Messages today</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">4.9/5</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">User rating</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">30s</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg. time saved</p>
                </div>
              </div>
              
              <button
                onClick={() => setCurrentPage('app')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
              >
                Try It Free - No Credit Card
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                ✨ 3 free rewrites daily • 💰 Pro only $1.99/month
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="container mx-auto px-6 pb-24">
            <h2 className="text-3xl font-bold text-center mb-12">Why Professionals Choose BossBuddy</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl w-fit mb-6">
                  <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">12+ Professional Tones</h3>
                <p className="text-gray-600 dark:text-gray-400">From formal to friendly, urgent to diplomatic - perfect tone every time</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl w-fit mb-6">
                  <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Lightning Fast</h3>
                <p className="text-gray-600 dark:text-gray-400">Get professionally written messages in under 2 seconds with AI</p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl w-fit mb-6">
                  <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Private & Secure</h3>
                <p className="text-gray-600 dark:text-gray-400">Your messages are never stored. Enterprise-grade security</p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="container mx-auto px-6 pb-24">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  "BossBuddy saved my career. I used to spend 30 minutes agonizing over every email to my boss. Now it takes 30 seconds and sounds 10x more professional."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full" />
                  <div>
                    <p className="font-semibold">Sarah Chen</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Marketing Manager at TechCorp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="container mx-auto px-6 pb-24">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Ready to Communicate Like a Pro?</h2>
              <p className="text-xl mb-8 opacity-90">Join thousands of professionals • Only $1.99/month</p>
              <button
                onClick={() => setCurrentPage('app')}
                className="px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Start 3-Day Free Trial
              </button>
              <p className="text-sm mt-4 opacity-80">No credit card required for trial</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentPage('landing')}
          >
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BossBuddy
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Usage Counter */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-md">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">
                {dailyUsage}/{userPlan === 'free' ? FREE_LIMIT : '∞'} today
              </span>
            </div>
            
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <History className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Templates */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quick Templates
                </h3>
                <div className="space-y-2">
                  {QUICK_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                        selectedTemplate === template.id 
                          ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' 
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{template.text}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{template.category}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Pro Templates Teaser */}
                {userPlan === 'free' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-xl">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Pro Templates
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Unlock 50+ industry-specific templates
                    </p>
                    <button 
                      onClick={() => setShowPricing(true)}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      Upgrade to Pro →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8">
                {/* Email Gate */}
                {showEmailGate && !emailSubmitted && dailyUsage >= FREE_LIMIT && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Continue with Email
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Get 3 more free rewrites today by entering your email
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      />
                      <button
                        onClick={handleEmailSubmit}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Your Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type or select a template..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {message.length} characters
                    </p>
                  </div>

                  {/* Tone Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Select Tone
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {TONES.free.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            tone === t.id 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' 
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl mb-1">{t.icon}</span>
                          <p className="text-sm font-medium">{t.name}</p>
                        </button>
                      ))}
                    </div>
                    
                    {/* Pro Tones */}
                    {userPlan === 'free' && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          <Lock className="w-4 h-4 inline mr-1" />
                          Pro Tones
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-50">
                          {TONES.pro.slice(0, 4).map(t => (
                            <button
                              key={t.id}
                              onClick={() => setShowPricing(true)}
                              className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gray-900 bg-opacity-10 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-gray-600" />
                              </div>
                              <span className="text-2xl mb-1">{t.icon}</span>
                              <p className="text-sm font-medium">{t.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !message}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        AI is writing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Rewrite Message
                      </>
                    )}
                  </button>
                </div>

                {/* Result */}
                {rewrittenMessage && (
                  <div className="mt-8 animate-fade-in">
                    {/* Comparison Toggle */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Your Professional Message
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowComparison(!showComparison)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                        >
                          {showComparison ? 'Hide' : 'Show'} Comparison
                        </button>
                        <button
                          onClick={resetForm}
                          className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 font-medium"
                        >
                          New Message
                        </button>
                      </div>
                    </div>
                    
                    {/* Comparison View */}
                    {showComparison && (
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Original:</p>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                            <p className="text-gray-700 dark:text-gray-300">{message}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Professional:</p>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                            <p className="text-gray-700 dark:text-gray-300 text-sm">View below ↓</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 mb-4">
                      <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                        {rewrittenMessage}
                      </pre>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-5 h-5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5" />
                            Copy
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={downloadAsPDF}
                        className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                    </div>
                    
                    {userPlan === 'free' && (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        Upgrade to Pro to remove watermark
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stats Banner */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium">{TOTAL_USERS.toLocaleString()} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">{MESSAGES_TODAY.toLocaleString()} today</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPricing(true)}
                    className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Go Pro - $1.99/mo →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message History Sidebar */}
        {showHistory && (
          <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-40 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Message History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {messageHistory.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4">
                  {messageHistory.map(item => (
                    <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {item.tone.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {item.original}
                      </p>
                      <button
                        onClick={() => {
                          setMessage(item.original);
                          setRewrittenMessage(item.rewritten);
                          setShowHistory(false);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Use Again →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Modal */}
        {showPricing && <PricingModal />}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default BossBuddy;