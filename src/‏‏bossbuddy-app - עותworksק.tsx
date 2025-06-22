// src/bossbuddy-app.tsx
import React, { useState, useEffect } from 'react';
import { Copy, Download, Sun, Moon } from 'lucide-react';
import { supabase, trackRewrite, checkDailyUsage } from './lib/supabase';

const BossBuddy = ({ userId, userEmail }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState('formal');
  const [rewrittenMessage, setRewrittenMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  // Fetch daily usage count when component mounts
  useEffect(() => {
    checkDailyUsage(userId).then(count => setDailyUsage(count));
  }, [userId]);

  // Stub rewrite logic; replace with real API call later
  const handleRewrite = async () => {
    if (!message) return;
    setLoading(true);
    setCopied(false);
    const fake = `${message} (rewritten in ${tone} tone)`;
    await trackRewrite(userId, message, fake, tone);
    setRewrittenMessage(fake);
    setLoading(false);
  };

  return (
    <main className={`flex flex-col items-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
    }`}>
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">BossBuddy</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Sign Out
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
            >
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}            
            </button>
          </div>
        </div>

        {/* User info */}
        <p className="mb-2">Signed in as <strong>{userEmail}</strong></p>
        <p className="mb-4 text-sm text-gray-500">~{dailyUsage} rewrites today</p>

        {/* Quick Templates */}
        <section className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            ['I need a sick day', 'Time Off'],
            ['I am running late due to traffic', 'Attendance'],
            ['Can we reschedule our meeting?', 'Meetings'],
            ['I’d like to request time off next week', 'Request Off'],
            ['I need more time to complete this project', 'Deadline'],
            ['I need help with this task', 'Support'],
          ].map(([txt, label]) => (
            <button
              key={label}
              onClick={() => setMessage(txt)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
            >
              {label}
            </button>
          ))}
        </section>

        {/* Message Input & Tone Selector */}
        <section className="mb-6">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-28 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="mt-3 flex space-x-2">
            {['formal','friendly','assertive','apologetic'].map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1 rounded ${tone === t ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Rewrite Button */}
        <button
          onClick={handleRewrite}
          className="w-full py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !message}
        >
          {loading ? 'Rewriting...' : 'Rewrite Message'}
        </button>

        {/* Rewritten Output */}
        {rewrittenMessage && (
          <section className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded">
            <p className="whitespace-pre-wrap mb-4">{rewrittenMessage}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => { navigator.clipboard.writeText(rewrittenMessage); setCopied(true); }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded"
              >
                {copied ? 'Copied!' : <Copy />} Copy
              </button>
              <button
                onClick={() => console.log('Download logic here')}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded"
              >
                <Download /> Download
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default BossBuddy;
