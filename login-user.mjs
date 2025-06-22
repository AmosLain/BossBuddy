import { createClient } from '@supabase/supabase-js';


// Connect to Supabase



const supabase = createClient(
  'https://wqjjijlhvlapmecioubn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY'
);

// Login function
async function loginUser() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user1234@testmail.dev',
    password: 'SecurePass123!'
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful!\nSession:', data.session);
  }
}

loginUser();
