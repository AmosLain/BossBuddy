// ===================================
// CHROME EXTENSION FOR BOSSBUDDY
// ===================================

// manifest.json
const manifest = {
  "manifest_version": 3,
  "name": "BossBuddy - Professional Email Assistant",
  "version": "1.0.0",
  "description": "Transform casual messages into professional communications with one click",
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus"
  ],
  "host_permissions": [
    "https://mail.google.com/*",
    "https://outlook.live.com/*",
    "https://outlook.office.com/*",
    "https://*.slack.com/*",
    "https://bossbuddy.ai/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://mail.google.com/*",
        "https://outlook.live.com/*",
        "https://outlook.office.com/*"
      ],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["inject.js", "styles.css"],
      "matches": ["<all_urls>"]
    }
  ]
};

// ===================================
// popup.html
// ===================================
const popupHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 380px;
      min-height: 500px;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .header p {
      margin: 5px 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .container {
      padding: 20px;
    }
    .input-group {
      margin-bottom: 15px;
    }
    .input-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 5px;
    }
    .input-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      resize: vertical;
      min-height: 100px;
      font-size: 14px;
      font-family: inherit;
    }
    .tone-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .tone-button {
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .tone-button:hover {
      border-color: #8b5cf6;
      transform: translateY(-1px);
    }
    .tone-button.selected {
      border-color: #8b5cf6;
      background: #f3e8ff;
    }
    .tone-button .emoji {
      font-size: 24px;
      margin-bottom: 4px;
    }
    .tone-button .name {
      font-size: 12px;
      font-weight: 500;
    }
    .rewrite-button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(to right, #3b82f6, #8b5cf6);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rewrite-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }
    .rewrite-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .result-container {
      margin-top: 20px;
      padding: 15px;
      background: #e0e7ff;
      border-radius: 8px;
      display: none;
    }
    .result-container.show {
      display: block;
    }
    .result-text {
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .action-buttons {
      display: flex;
      gap: 10px;
    }
    .action-button {
      flex: 1;
      padding: 8px;
      border: 1px solid #8b5cf6;
      border-radius: 6px;
      background: white;
      color: #8b5cf6;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-button:hover {
      background: #8b5cf6;
      color: white;
    }
    .status {
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      margin-top: 10px;
    }
    .status.error {
      color: #ef4444;
    }
    .upgrade-banner {
      background: #fef3c7;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 15px;
      text-align: center;
    }
    .upgrade-banner p {
      margin: 0 0 8px;
      font-size: 13px;
      color: #92400e;
    }
    .upgrade-banner a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>BossBuddy</h1>
    <p>Professional messages in one click</p>
  </div>
  
  <div class="container">
    <div id="upgradeBanner" class="upgrade-banner" style="display: none;">
      <p>You've used 3/3 free rewrites today</p>
      <a href="https://bossbuddy.ai/upgrade?src=extension" target="_blank">Upgrade for unlimited →</a>
    </div>
    
    <div class="input-group">
      <label>Your Message</label>
      <textarea id="messageInput" placeholder="Type or paste your message here..."></textarea>
    </div>
    
    <div class="input-group">
      <label>Select Tone</label>
      <div class="tone-grid">
        <div class="tone-button" data-tone="formal">
          <div class="emoji">👔</div>
          <div class="name">Formal</div>
        </div>
        <div class="tone-button" data-tone="friendly">
          <div class="emoji">😊</div>
          <div class="name">Friendly</div>
        </div>
        <div class="tone-button" data-tone="assertive">
          <div class="emoji">💪</div>
          <div class="name">Assertive</div>
        </div>
        <div class="tone-button" data-tone="apologetic">
          <div class="emoji">🙏</div>
          <div class="name">Apologetic</div>
        </div>
      </div>
    </div>
    
    <button id="rewriteButton" class="rewrite-button">
      ✨ Rewrite Message
    </button>
    
    <div id="resultContainer" class="result-container">
      <div id="resultText" class="result-text"></div>
      <div class="action-buttons">
        <button id="copyButton" class="action-button">📋 Copy</button>
        <button id="insertButton" class="action-button">📧 Insert</button>
      </div>
    </div>
    
    <div id="status" class="status"></div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
`;

// ===================================
// popup.js
// ===================================
const popupJS = `
// Check authentication and usage
let userPlan = 'free';
let dailyUsage = 0;
let selectedTone = 'formal';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load user data
  const userData = await chrome.storage.sync.get(['userPlan', 'dailyUsage', 'lastUsed']);
  
  // Reset daily usage if new day
  const today = new Date().toDateString();
  if (userData.lastUsed !== today) {
    dailyUsage = 0;
    await chrome.storage.sync.set({ dailyUsage: 0, lastUsed: today });
  } else {
    dailyUsage = userData.dailyUsage || 0;
  }
  
  userPlan = userData.userPlan || 'free';
  
  // Show upgrade banner if limit reached
  if (userPlan === 'free' && dailyUsage >= 3) {
    document.getElementById('upgradeBanner').style.display = 'block';
  }
  
  // Update status
  updateStatus(\`\${3 - dailyUsage} rewrites remaining today\`);
  
  // Get selected text from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectedText' }, (response) => {
      if (response && response.text) {
        document.getElementById('messageInput').value = response.text;
      }
    });
  });
});

// Tone selection
document.querySelectorAll('.tone-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tone-button').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
    selectedTone = button.dataset.tone;
  });
});

// Select first tone by default
document.querySelector('.tone-button').click();

// Rewrite message
document.getElementById('rewriteButton').addEventListener('click', async () => {
  const message = document.getElementById('messageInput').value.trim();
  
  if (!message) {
    updateStatus('Please enter a message', 'error');
    return;
  }
  
  // Check usage limit
  if (userPlan === 'free' && dailyUsage >= 3) {
    updateStatus('Daily limit reached. Upgrade for unlimited!', 'error');
    return;
  }
  
  // Disable button and show loading
  const button = document.getElementById('rewriteButton');
  button.disabled = true;
  button.textContent = '⏳ Rewriting...';
  
  try {
    // Call API
    const response = await fetch('https://bossbuddy.ai/api/rewrite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension': 'true'
      },
      body: JSON.stringify({
        message,
        tone: selectedTone,
        source: 'extension'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show result
      document.getElementById('resultText').textContent = data.rewritten;
      document.getElementById('resultContainer').classList.add('show');
      
      // Update usage
      dailyUsage++;
      await chrome.storage.sync.set({ dailyUsage });
      
      updateStatus(\`Success! \${3 - dailyUsage} rewrites remaining today\`);
    } else {
      updateStatus(data.error || 'Failed to rewrite message', 'error');
    }
  } catch (error) {
    updateStatus('Network error. Please try again.', 'error');
  }
  
  // Re-enable button
  button.disabled = false;
  button.textContent = '✨ Rewrite Message';
});

// Copy result
document.getElementById('copyButton').addEventListener('click', () => {
  const text = document.getElementById('resultText').textContent;
  navigator.clipboard.writeText(text);
  
  const button = document.getElementById('copyButton');
  button.textContent = '✓ Copied!';
  setTimeout(() => {
    button.textContent = '📋 Copy';
  }, 2000);
});

// Insert into page
document.getElementById('insertButton').addEventListener('click', () => {
  const text = document.getElementById('resultText').textContent;
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'insertText',
      text: text
    });
    
    // Close popup
    window.close();
  });
});

function updateStatus(message, type = '') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
}
`;

// ===================================
// content.js - Content Script
// ===================================
const contentJS = `
// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  } else if (request.action === 'insertText') {
    insertTextAtCursor(request.text);
  }
});

// Insert text at cursor position
function insertTextAtCursor(text) {
  const activeElement = document.activeElement;
  
  // Handle different input types
  if (activeElement.tagName === 'TEXTAREA' || 
      (activeElement.tagName === 'INPUT' && activeElement.type === 'text')) {
    // Regular input/textarea
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const value = activeElement.value;
    
    activeElement.value = value.substring(0, start) + text + value.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
    activeElement.focus();
    
    // Trigger change event
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    
  } else if (activeElement.contentEditable === 'true') {
    // ContentEditable (Gmail, Outlook, etc.)
    document.execCommand('insertText', false, text);
    
  } else {
    // Try to find compose area (Gmail specific)
    const composeArea = findComposeArea();
    if (composeArea) {
      composeArea.focus();
      document.execCommand('insertText', false, text);
    }
  }
}

// Find Gmail/Outlook compose area
function findComposeArea() {
  // Gmail
  let compose = document.querySelector('div[aria-label="Message Body"]');
  if (compose) return compose;
  
  // Outlook
  compose = document.querySelector('div[aria-label="Message body"]');
  if (compose) return compose;
  
  // Generic contenteditable
  compose = document.querySelector('div[contenteditable="true"]');
  return compose;
}

// Add floating button to compose windows
function addFloatingButton() {
  // Check if we're in a compose window
  const composeArea = findComposeArea();
  if (!composeArea || document.getElementById('bossbuddy-float')) return;
  
  const button = document.createElement('div');
  button.id = 'bossbuddy-float';
  button.className = 'bossbuddy-floating-button';
  button.innerHTML = '✨';
  button.title = 'Rewrite with BossBuddy';
  
  button.addEventListener('click', () => {
    // Get selected text or all text
    const selectedText = window.getSelection().toString() || composeArea.innerText;
    
    // Send to extension popup
    chrome.runtime.sendMessage({
      action: 'openPopupWithText',
      text: selectedText
    });
  });
  
  document.body.appendChild(button);
}

// Watch for compose windows
const observer = new MutationObserver(() => {
  addFloatingButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
`;

// ===================================
// background.js - Service Worker
// ===================================
const backgroundJS = `
// Install event
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: 'rewriteWithBossBuddy',
    title: 'Rewrite with BossBuddy',
    contexts: ['selection']
  });
  
  // Set default storage values
  chrome.storage.sync.set({
    userPlan: 'free',
    dailyUsage: 0,
    lastUsed: new Date().toDateString()
  });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rewriteWithBossBuddy' && info.selectionText) {
    // Store selected text
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      // Open popup
      chrome.action.openPopup();
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopupWithText') {
    chrome.storage.local.set({ selectedText: request.text }, () => {
      chrome.action.openPopup();
    });
  }
});

// Check authentication periodically
async function checkAuth() {
  try {
    const response = await fetch('https://bossbuddy.ai/api/auth/check', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    chrome.storage.sync.set({
      userPlan: data.plan || 'free',
      isAuthenticated: data.authenticated || false
    });
    
    // Update badge
    if (data.plan === 'pro' || data.plan === 'pro_plus') {
      chrome.action.setBadgeText({ text: 'PRO' });
      chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6' });
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

// Check auth on startup and every 30 minutes
checkAuth();
setInterval(checkAuth, 30 * 60 * 1000);
`;

// ===================================
// styles.css
// ===================================
const stylesCSS = `
.bossbuddy-floating-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  z-index: 9999;
  transition: all 0.3s ease;
}

.bossbuddy-floating-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.bossbuddy-highlight {
  background-color: rgba(139, 92, 246, 0.1);
  border: 2px dashed #8b5cf6;
  padding: 2px;
  border-radius: 4px;
}
`;

// ===================================
// CHROME EXTENSION STORE LISTING
// ===================================
const storeListing = {
  title: "BossBuddy - Professional Email Assistant",
  
  shortDescription: 
    "Transform casual messages into professional communications with one click. Perfect for work emails, Slack, and more.",
  
  detailedDescription: `
🚀 Never stress about work emails again!

BossBuddy instantly rewrites your casual messages into professional communications that impress your boss, colleagues, and clients.

✨ KEY FEATURES:
• One-click message rewriting
• 4 professional tones (Formal, Friendly, Assertive, Apologetic)
• Works on Gmail, Outlook, Slack, and more
• Right-click any text to rewrite
• Floating button in compose windows
• 3 free rewrites daily

🎯 PERFECT FOR:
• Email to your boss
• Slack messages
• LinkedIn communications  
• Client correspondence
• Meeting requests
• Status updates

💼 HOW IT WORKS:
1. Type or select your message
2. Choose a tone
3. Click rewrite
4. Copy or insert the professional version

🆓 FREE PLAN:
• 3 rewrites per day
• 4 professional tones
• All core features

💎 PRO PLAN ($1.99/month):
• Unlimited rewrites
• 12+ professional tones
• Priority processing
• Message history
• No daily limits

🔒 PRIVACY FIRST:
• No message storage
• Encrypted connections
• No data selling
• GDPR compliant

Join thousands of professionals who save hours every week with BossBuddy!

Questions? Visit bossbuddy.ai or email support@bossbuddy.ai
`,
  
  screenshots: [
    "screenshot1-main-interface.png",
    "screenshot2-gmail-integration.png", 
    "screenshot3-tone-selection.png",
    "screenshot4-result-example.png",
    "screenshot5-context-menu.png"
  ],
  
  promoImages: {
    small: "promo-440x280.png",
    large: "promo-1400x560.png",
    marquee: "promo-1400x560.png"
  },
  
  category: "Productivity",
  
  tags: [
    "email",
    "productivity", 
    "professional",
    "communication",
    "workplace",
    "AI",
    "writing assistant"
  ]
};

// ===================================
// INSTALLATION INSTRUCTIONS
// ===================================
const installationGuide = `
## Chrome Extension Setup Guide

### 1. Prepare Extension Files
\`\`\`
bossbuddy-extension/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
\`\`\`

### 2. Create Icons
Use your logo to generate icons in required sizes:
- 16x16 (toolbar)
- 32x32 (Windows)
- 48x48 (extensions page)
- 128x128 (Chrome Web Store)

### 3. Test Locally
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your extension folder
5. Test all features

### 4. Prepare for Chrome Web Store
1. Create screenshots (1280x800 or 640x400)
2. Create promotional images
3. Zip extension files
4. Create developer account ($5 one-time fee)

### 5. Submit to Store
1. Go to Chrome Web Store Developer Dashboard
2. Click "New Item"
3. Upload ZIP file
4. Fill in store listing details
5. Add screenshots and promo images
6. Set visibility (Public)
7. Submit for review

### 6. Post-Launch Growth
- Add "Install Chrome Extension" banner on website
- Email existing users
- Add to Product Hunt
- Create demo video
- Run Google Ads for "email assistant" keywords
`;

// Export complete extension package
module.exports = {
  manifest,
  popupHTML,
  popupJS,
  contentJS,
  backgroundJS,
  stylesCSS,
  storeListing,
  installationGuide
};