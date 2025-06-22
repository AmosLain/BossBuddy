// src/bossbuddy-app.tsx
import React, { useState, useEffect } from 'react';
import { Copy, Download, Clock, Calendar, Briefcase, User, FileText, HelpCircle, Sparkles, LogOut, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OpenAI from 'openai';
import { supabase, trackRewrite, checkDailyUsage } from './lib/supabase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const BossBuddy = ({ userId, userEmail }) => {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('formal');
  const [rewrittenMessage, setRewrittenMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    checkDailyUsage(userId).then(count => setDailyUsage(count));
  }, [userId]);

  const handleRewrite = async () => {
    if (!message) return;
    setLoading(true);
    setCopied(false);
    try {
      const systemPrompt = `You are a world-class writing assistant. Rewrite the email message below in a ${tone} tone, preserving meaning while making it elegant and engaging.`;
      const userPrompt = `Message:\n"${message}"`;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 350,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      });
      const rewritten = response.choices?.[0]?.message.content.trim() || '';
      setRewrittenMessage(rewritten);
      await trackRewrite(userId, message, rewritten, tone);
      setDailyUsage(prev => prev + 1);
    } catch (error) {
      console.error('Rewrite error:', error);
      setRewrittenMessage('Sorry, could not generate rewrite.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!rewrittenMessage) return;
    const blob = new Blob([rewrittenMessage], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rewritten_message.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const templates = [
    { text: 'I need a sick day', label: 'Time Off', icon: Calendar },
    { text: "I'm running late due to traffic", label: 'Attendance', icon: Clock },
    { text: 'Can we reschedule our meeting?', label: 'Meetings', icon: Briefcase },
    { text: 'Please approve time off next week', label: 'Request Off', icon: Calendar },
    { text: 'I need more time on this project', label: 'Deadline', icon: FileText },
    { text: 'I need help with this task', label: 'Support', icon: HelpCircle },
  ];

  const tones = [
    { value: 'formal', label: 'Formal' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'assertive', label: 'Assertive' },
    { value: 'apologetic', label: 'Apologetic' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-slate-900">BossBuddy</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">{userEmail}</p>
                <p className="text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {dailyUsage} rewrites today
                  </span>
                </p>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Templates Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Quick Templates
              </h2>
              <div className="space-y-2">
                {templates.map(({ text, label, icon: Icon }) => (
                  <motion.button
                    key={label}
                    onClick={() => setMessage(text)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 bg-slate-50 hover:bg-violet-50 rounded-xl text-left transition-all duration-200 group border border-transparent hover:border-violet-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors shadow-sm">
                        <Icon size={18} className="text-slate-600 group-hover:text-violet-600 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500 truncate">{text}</p>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-8 space-y-6">
            {/* Message Input Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Compose Your Message</h2>
              <textarea
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type your message here or select a template from the left..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-slate-900 placeholder-slate-400 resize-none transition-all"
              />
              
              {/* Tone Selection */}
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Select Tone</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {tones.map(({ value, label }) => (
                    <motion.button
                      key={value}
                      onClick={() => setTone(value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        tone === value 
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Character Count */}
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-slate-500">{message.length} characters</p>
                <p className="text-xs text-slate-500">AI-powered rewriting</p>
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.button
              onClick={handleRewrite}
              disabled={loading || !message}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-semibold shadow-lg disabled:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rewriting your message...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Rewrite with AI
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>

            {/* Result Card */}
            <AnimatePresence>
              {rewrittenMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Sparkles size={16} className="text-white" />
                      </div>
                      AI-Enhanced Message
                    </h3>
                    <span className="text-xs font-medium text-violet-700 bg-violet-100 px-3 py-1 rounded-full">
                      {tone} tone
                    </span>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{rewrittenMessage}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => { 
                        navigator.clipboard.writeText(rewrittenMessage); 
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        copied 
                          ? 'bg-green-600 text-white shadow-md' 
                          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <Copy size={16} />
                      {copied ? 'Copied!' : 'Copy'}
                    </motion.button>
                    
                    <motion.button
                      onClick={handleDownload}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium border border-slate-200 transition-all"
                    >
                      <Download size={16} />
                      Download
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BossBuddy;