// src/bossbuddy-app.tsx
import React, { useState, useEffect } from 'react';
import { Copy, Download } from 'lucide-react';
import OpenAI from 'openai';
import { supabase, trackRewrite, checkDailyUsage } from './lib/supabase';

// Initialize OpenAI client in browser-safe mode
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

  // Fetch today's usage count
  useEffect(() => {
    checkDailyUsage(userId).then(count => setDailyUsage(count));
  }, [userId]);

  // Rewrite message using GPT-4 for elegant output
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
      await trackRewrite(userId);
    } catch (error) {
      console.error('Rewrite error:', error);
      setRewrittenMessage('Sorry, could not generate rewrite.');
    } finally {
      setLoading(false);
    }
  };

  // Download rewritten text as .txt
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

  return (
    <main className="min-h-screen bg-white text-gray-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl bg-gray-50 shadow-xl rounded-lg p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold">BossBuddy</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
          >
            Sign Out
          </button>
        </div>

        {/* Usage Info */}
        <div className="text-right mb-6">
          <p className="text-sm text-gray-600">Signed in as <span className="font-medium">{userEmail}</span></p>
          <p className="text-sm text-gray-600">~{dailyUsage} rewrites today</p>
        </div>

        {/* Templates */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
          {[
            ['I need a sick day', 'Time Off'],
            ['I’m running late due to traffic', 'Attendance'],
            ['Can we reschedule our meeting?', 'Meetings'],
            ['Please approve time off next week', 'Request Off'],
            ['I need more time on this project', 'Deadline'],
            ['I need help with this task', 'Support'],
          ].map(([txt, label]) => (
            <button
              key={label}
              onClick={() => setMessage(txt)}
              className="py-3 px-4 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium transition"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Message Input and Tone */}
        <div className="mb-8">
          <textarea
            rows={5}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-base"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {['formal','friendly','assertive','apologetic'].map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-4 py-2 rounded-full font-semibold transition ${
                  tone === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Rewrite and Output */}
        <div className="text-center mb-8">
          <button
            onClick={handleRewrite}
            disabled={loading || !message}
            className="w-full sm:w-auto py-3 px-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
          >
            {loading ? 'Rewriting...' : 'Rewrite Message'}
          </button>
        </div>

        {rewrittenMessage && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
            <p className="whitespace-pre-wrap text-lg mb-6">{rewrittenMessage}</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => { navigator.clipboard.writeText(rewrittenMessage); setCopied(true); }}
                className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <Copy size={18}/> Copy
              </button>
              <button
                onClick={handleDownload}
                className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition flex items-center gap-2"
              >
                <Download size={18}/> Download
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default BossBuddy;
