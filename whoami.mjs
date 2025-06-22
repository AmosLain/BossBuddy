// whoami.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function whoAmI() {
  if (!fs.existsSync('session.json')) {
    console.error('session.json not found. Run test-user-creation.mjs first.');
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync('session.json', 'utf-8'));

  const supabase = createClient(
    'https://wqjjijlhvlapmecioubn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamppamxodmxhcG1lY2lvdWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTYxMzgsImV4cCI6MjA2NTY3MjEzOH0.F0csA_SBcrPuhQ33SiYwrGnUsPE6SDuJ2HQ0JLUcapY',
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    }
  );

  // Now fetch the current user
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Failed to fetch user:', error.message);
  } else if (data && data.user) {
    console.log('Logged in as:', data.user.email);
    console.log('Full user data:', JSON.stringify(data.user, null, 2));
  } else {
    console.log('No user returned.');
  }
}

whoAmI();