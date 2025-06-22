// App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import BossBuddy from './bossbuddy-app';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes (login, logout)
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="App">
      {!session ? (
        // Show Supabase Auth UI
        <Auth />
      ) : (
        // Once signed in, render the BossBuddy dashboard
        <BossBuddy userId={session.user.id} userEmail={session.user.email} />
      )}
    </div>
  );
}
