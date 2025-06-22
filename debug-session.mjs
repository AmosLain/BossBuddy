// debug-session.mjs
import fs from 'fs';

console.log('🔍 Debugging Session Issue\n');

// Check if session.json exists
if (fs.existsSync('session.json')) {
  console.log('✅ session.json exists');
  
  try {
    const session = JSON.parse(fs.readFileSync('session.json', 'utf-8'));
    console.log('📄 Session content:');
    console.log(`   Access Token: ${session.access_token ? session.access_token.substring(0, 20) + '...' : 'missing'}`);
    console.log(`   Expires At: ${session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'missing'}`);
    
    // Check if expired
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      if (now > expiresAt) {
        console.log('❌ Session is EXPIRED!');
      } else {
        console.log('✅ Session is still valid');
      }
    }
  } catch (err) {
    console.error('❌ Error reading session.json:', err.message);
  }
} else {
  console.log('❌ session.json does NOT exist');
  console.log('   Run test-user-creation.mjs to create one');
}

// Check what files exist
console.log('\n📁 JSON files in directory:');
const files = fs.readdirSync('.').filter(f => f.endsWith('.json'));
files.forEach(file => {
  const stats = fs.statSync(file);
  console.log(`   ${file} - Last modified: ${stats.mtime.toLocaleString()}`);
});