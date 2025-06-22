// src/bossbuddy-app.tsx
import React, { useState, useEffect } from 'react';
import { Copy, Download, Clock, Calendar, Briefcase, User, FileText, HelpCircle, Sparkles, LogOut, ArrowRight, Mail } from 'lucide-react';
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
    { text: 'I need a sick day', label: 'Time Off', icon: Calendar, bgColor: 'bg-red-500', iconBg: 'bg-red-600' },
    { text: "I'm running late due to traffic", label: 'Attendance', icon: Clock, bgColor: 'bg-orange-500', iconBg: 'bg-orange-600' },
    { text: 'Can we reschedule our meeting?', label: 'Meetings', icon: Briefcase, bgColor: 'bg-blue-500', iconBg: 'bg-blue-600' },
    { text: 'Please approve time off next week', label: 'Request Off', icon: Calendar, bgColor: 'bg-purple-500', iconBg: 'bg-purple-600' },
    { text: 'I need more time on this project', label: 'Deadline', icon: FileText, bgColor: 'bg-yellow-500', iconBg: 'bg-yellow-600' },
    { text: 'I need help with this task', label: 'Support', icon: HelpCircle, bgColor: 'bg-green-500', iconBg: 'bg-green-600' },
  ];

  const tones = [
    { value: 'formal', label: 'Formal', bgColor: 'bg-gray-700', activeBg: 'bg-gray-900' },
    { value: 'friendly', label: 'Friendly', bgColor: 'bg-blue-500', activeBg: 'bg-blue-700' },
    { value: 'assertive', label: 'Assertive', bgColor: 'bg-red-500', activeBg: 'bg-red-700' },
    { value: 'apologetic', label: 'Apologetic', bgColor: 'bg-purple-500', activeBg: 'bg-purple-700' },
  ];

  return (
    <div className="min-h-screen bg-indigo-600 text-white">
      {/* Header */}
      <header className="bg-indigo-800 border-b-4 border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                <Mail className="w-7 h-7 text-indigo-900" />
              </div>
              <h1 className="text-3xl font-bold text-white">BossBuddy</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-indigo-200">{userEmail}</p>
                <p className="text-xs text-indigo-300 font-bold">{dailyUsage} rewrites today</p>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-8 text-gray-900">
          {/* Templates */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-indigo-900 mb-6">Quick Templates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {templates.map(({ text, label, icon: Icon, bgColor, iconBg }) => (
                <motion.button
                  key={label}
                  onClick={() => setMessage(text)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`${bgColor} text-white p-4 rounded-xl hover:opacity-90 transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-xs opacity-90 mt-1">{text}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Your Message</h2>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here or select a template above..."
              className="w-full p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Tone Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-indigo-900 mb-4">Select Tone</h2>
            <div className="flex flex-wrap gap-3">
              {tones.map(({ value, label, bgColor, activeBg }) => (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
                    tone === value ? activeBg : bgColor
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Rewrite Button */}
          <motion.button
            onClick={handleRewrite}
            disabled={loading || !message}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Rewrite Message
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>

          {/* Result */}
          <AnimatePresence>
            {rewrittenMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mt-8 bg-yellow-100 border-4 border-yellow-400 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                  <Sparkles className="text-yellow-600" />
                  Rewritten Message
                </h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 border-2 border-yellow-300">
                  <p className="text-gray-800 whitespace-pre-wrap">{rewrittenMessage}</p>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => { 
                      navigator.clipboard.writeText(rewrittenMessage); 
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white transition-all ${
                      copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Copy size={18} />
                    {copied ? 'Copied!' : 'Copy'}
                  </motion.button>
                  
                  <motion.button
                    onClick={handleDownload}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all"
                  >
                    <Download size={18} />
                    Download
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default BossBuddy;