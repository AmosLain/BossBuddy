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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">BossBuddy</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">{userEmail}</p>
                <p className="text-xs text-gray-500">{dailyUsage} rewrites today</p>
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Templates */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Templates</h2>
                <div className="space-y-3">
                  {templates.map(({ text, label, icon: Icon }) => (
                    <motion.button
                      key={label}
                      onClick={() => setMessage(text)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Icon size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{text}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Message Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* Message Input */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h2>
                <textarea
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message here or select a template..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none transition-all"
                />
                
                {/* Tone Selection */}
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3">Select Tone</p>
                  <div className="flex flex-wrap gap-2">
                    {tones.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setTone(value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          tone === value 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Rewrite Message
                    </>
                  )}
                </motion.button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {rewrittenMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Rewritten Message</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {tone.charAt(0).toUpperCase() + tone.slice(1)} tone
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          copied 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Copy size={16} />
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </motion.button>
                      
                      <motion.button
                        onClick={handleDownload}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all"
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
        </div>
      </main>
    </div>
  );
};

export default BossBuddy;