// ===================================
// CUSTOMER SUPPORT SYSTEM
// ===================================

// components/SupportWidget.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Bot, User } from 'lucide-react';

export const SupportWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      addBotMessage("👋 Hi! I'm BuddyBot. How can I help you today?", [
        'I have a billing question',
        'How do I use BossBuddy?',
        'I found a bug',
        'Talk to human support'
      ]);
    }
  }, [isOpen]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(scrollToBottom, [messages]);
  
  const addBotMessage = (text, quickReplies = []) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      quickReplies
    }]);
  };
  
  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
  };
  
  const handleSend = async () => {
    if (!inputMessage.trim()) return;
    
    const userMsg = inputMessage;
    setInputMessage('');
    addUserMessage(userMsg);
    setIsTyping(true);
    
    // Process message
    const response = await processMessage(userMsg);
    
    setTimeout(() => {
      setIsTyping(false);
      addBotMessage(response.text, response.quickReplies);
      
      if (response.escalate) {
        createSupportTicket(userMsg);
      }
    }, 1000);
  };
  
  const processMessage = async (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Common questions
    if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return {
        text: "I can help with billing! Here's what I found:\n\n💳 **Current Plan**: " + (user?.plan || 'Free') + "\n💰 **Price**: $1.99/month\n🔄 **Next billing**: " + (user?.nextBilling || 'N/A') + "\n\nWould you like to update your payment method or cancel your subscription?",
        quickReplies: ['Update payment', 'Cancel subscription', 'View invoices']
      };
    }
    
    if (lowerMessage.includes('how') || lowerMessage.includes('use')) {
      return {
        text: "Here's a quick guide:\n\n1. 📝 Type or paste your message\n2. 🎯 Choose a tone (Formal, Friendly, etc.)\n3. ✨ Click 'Rewrite Message'\n4. 📋 Copy and send!\n\nWant to see a video tutorial?",
        quickReplies: ['Watch tutorial', 'See examples', 'More features']
      };
    }
    
    if (lowerMessage.includes('bug') || lowerMessage.includes('issue') || lowerMessage.includes('problem')) {
      return {
        text: "I'm sorry you're experiencing issues. Can you describe what's happening?",
        quickReplies: ['App not loading', 'Payment failed', 'Messages not rewriting', 'Other issue'],
        escalate: true
      };
    }
    
    if (lowerMessage.includes('human') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return {
        text: "I'll connect you with our support team. Creating a ticket now...",
        escalate: true
      };
    }
    
    // Default response
    return {
      text: "I'm not sure about that. Would you like me to connect you with our support team?",
      quickReplies: ['Yes, get human help', 'No, thanks']
    };
  };
  
  const createSupportTicket = async (message) => {
    try {
      await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          message,
          priority: 'normal'
        })
      });
      
      setTimeout(() => {
        addBotMessage("✅ Support ticket created! Our team will respond within 24 hours via email.");
      }, 2000);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };
  
  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">BuddyBot Support</h3>
                <p className="text-xs opacity-90">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.sender === 'user' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      msg.sender === 'user' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                  
                  {/* Quick Replies */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInputMessage(reply);
                            handleSend();
                          }}
                          className="text-xs px-3 py-1 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputMessage.trim()}
                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Powered by BuddyBot AI
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// ===================================
// HELP CENTER
// ===================================

// pages/help.tsx
export const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I use BossBuddy?',
          a: 'Simply type or paste your message, select a tone (Formal, Friendly, etc.), and click "Rewrite Message". Your professionally rewritten message will appear instantly!'
        },
        {
          q: 'What tones are available?',
          a: 'Free users get 4 tones: Formal, Friendly, Assertive, and Apologetic. Pro users unlock 12+ tones including Diplomatic, Urgent, Confident, and more.'
        },
        {
          q: 'How many messages can I rewrite?',
          a: 'Free users can rewrite 3 messages per day. Pro users ($1.99/month) get unlimited rewrites.'
        }
      ]
    },
    {
      category: 'Billing',
      questions: [
        {
          q: 'How much does BossBuddy cost?',
          a: 'BossBuddy Pro costs only $1.99/month or $19/year (save 20%). You can try it free for 3 days.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards, PayPal, and regional payment methods through our secure payment processors.'
        },
        {
          q: 'Can I cancel anytime?',
          a: 'Yes! You can cancel your subscription anytime from your account settings. You\'ll keep access until the end of your billing period.'
        }
      ]
    },
    {
      category: 'Features',
      questions: [
        {
          q: 'Does BossBuddy work with Gmail and Outlook?',
          a: 'Yes! Our Chrome extension works seamlessly with Gmail, Outlook, and other email providers. Just install and start rewriting.'
        },
        {
          q: 'Is my data secure?',
          a: 'Absolutely. We never store your messages, use bank-level encryption, and are fully GDPR compliant.'
        },
        {
          q: 'Can I use BossBuddy for Slack?',
          a: 'Yes! The Chrome extension works on Slack web. Pro+ users also get direct Slack integration.'
        }
      ]
    }
  ];
  
  const filteredFAQs = faqs
    .map(category => ({
      ...category,
      questions: category.questions.filter(
        q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
             q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }))
    .filter(category => 
      selectedCategory === 'all' || 
      category.category === selectedCategory
    );
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-xl opacity-90">Find answers to your questions</p>
          
          {/* Search */}
          <div className="mt-8 max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full px-6 py-4 rounded-full text-gray-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full ${
              selectedCategory === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Categories
          </button>
          {faqs.map(category => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(category.category)}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === category.category 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.category}
            </button>
          ))}
        </div>
        
        {/* FAQs */}
        <div className="space-y-8">
          {filteredFAQs.map(category => (
            <div key={category.category}>
              {category.questions.length > 0 && (
                <>
                  <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
                  <div className="space-y-4">
                    {category.questions.map((item, idx) => (
                      <details
                        key={idx}
                        className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <summary className="font-semibold text-lg">
                          {item.q}
                        </summary>
                        <p className="mt-4 text-gray-600 leading-relaxed">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Contact Support */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Start Live Chat
            </button>
            <button className="px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50">
              Email Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================
// SECURITY IMPLEMENTATION
// ===================================

// lib/security.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export class SecurityManager {
  // Rate limiting
  private static rateLimitMap = new Map<string, RateLimitData>();
  
  static async rateLimit(
    identifier: string, 
    limit: number = 10, 
    windowMs: number = 60000
  ): Promise<boolean> {
    const now = Date.now();
    const data = this.rateLimitMap.get(identifier) || { count: 0, resetTime: now + windowMs };
    
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }
    
    data.count++;
    this.rateLimitMap.set(identifier, data);
    
    return data.count <= limit;
  }
  
  // CSRF Protection
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  }
  
  // API Key Management
  static async generateAPIKey(userId: string): Promise<string> {
    const key = `bb_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashAPIKey(key);
    
    // Store hashed key in database
    await supabase.from('api_keys').insert({
      user_id: userId,
      key_hash: hashedKey,
      created_at: new Date()
    });
    
    return key;
  }
  
  static hashAPIKey(key: string): string {
    return crypto
      .createHmac('sha256', process.env.API_KEY_SECRET!)
      .update(key)
      .digest('hex');
  }
  
  // Input Sanitization
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/javascript:/gi, '') // Remove JS protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }
  
  // XSS Protection
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // SQL Injection Prevention (using parameterized queries)
  static async safeQuery(query: string, params: any[]) {
    // Always use parameterized queries
    return await prisma.$queryRaw(query, ...params);
  }
  
  // Password Hashing
  static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');
    return `${salt}:${hash}`;
  }
  
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
      .toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  }
  
  // Content Security Policy
  static getCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.bossbuddy.ai https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// ===================================
// SECURITY MIDDLEWARE
// ===================================

// middleware/security.ts
export async function securityMiddleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', SecurityManager.getCSPHeader());
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const isAllowed = await SecurityManager.rateLimit(ip, 100, 60000); // 100 requests per minute
    
    if (!isAllowed) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }
  
  // API Key validation for protected routes
  if (req.nextUrl.pathname.startsWith('/api/v1/')) {
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new NextResponse('API Key Required', { status: 401 });
    }
    
    const hashedKey = SecurityManager.hashAPIKey(apiKey);
    const validKey = await validateAPIKey(hashedKey);
    
    if (!validKey) {
      return new NextResponse('Invalid API Key', { status: 401 });
    }
  }
  
  return response;
}

// ===================================
// AUTHENTICATION HELPERS
// ===================================

// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';

export class AuthManager {
  private static secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  
  static async createToken(payload: any): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.secret);
  }
  
  static async verifyToken(token: string): Promise<any> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return payload;
    } catch (error) {
      return null;
    }
  }
  
  static async createSession(userId: string, req: Request): Promise<string> {
    const sessionId = crypto.randomUUID();
    const userAgent = req.headers.get('user-agent') || '';
    const ip = req.headers.get('x-forwarded-for') || '';
    
    // Store session
    await supabase.from('sessions').insert({
      id: sessionId,
      user_id: userId,
      user_agent: userAgent,
      ip_address: ip,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return sessionId;
  }
  
  static async validateSession(sessionId: string): Promise<any> {
    const { data: session } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    return session;
  }
}

// ===================================
// DATA ENCRYPTION
// ===================================

// lib/encryption.ts
export class EncryptionManager {
  private static algorithm = 'aes-256-gcm';
  private static key = crypto.scryptSync(
    process.env.ENCRYPTION_KEY!,
    'salt',
    32
  );
  
  static encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  static decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(data.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

// ===================================
// AUDIT LOGGING
// ===================================

// lib/audit.ts
export class AuditLogger {
  static async log(event: AuditEvent) {
    await supabase.from('audit_logs').insert({
      user_id: event.userId,
      action: event.action,
      resource: event.resource,
      details: event.details,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      created_at: new Date()
    });
  }
  
  static async logSecurityEvent(event: SecurityEvent) {
    await supabase.from('security_events').insert({
      type: event.type,
      severity: event.severity,
      details: event.details,
      ip_address: event.ipAddress,
      created_at: new Date()
    });
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await this.sendSecurityAlert(event);
    }
  }
  
  private static async sendSecurityAlert(event: SecurityEvent) {
    // Send to admin email/Slack
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `[CRITICAL] Security Event: ${event.type}`,
      template: 'security-alert',
      data: event
    });
  }
}

interface AuditEvent {
  userId: string;
  action: string;
  resource: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
}

interface SecurityEvent {
  type: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  ipAddress: string;
}

// ===================================
// GDPR COMPLIANCE
// ===================================

// lib/gdpr.ts
export class GDPRManager {
  // Data export
  static async exportUserData(userId: string): Promise<any> {
    const data = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('usage_logs').select('*').eq('user_id', userId),
      supabase.from('subscriptions').select('*').eq('user_id', userId),
      supabase.from('referrals').select('*').eq('referrer_id', userId)
    ]);
    
    return {
      user: data[0].data,
      usage: data[1].data,
      subscriptions: data[2].data,
      referrals: data[3].data,
      exportedAt: new Date().toISOString()
    };
  }
  
  // Data deletion
  static async deleteUserData(userId: string): Promise<void> {
    // Soft delete first
    await supabase
      .from('users')
      .update({ 
        deleted_at: new Date(),
        email: `deleted_${userId}@deleted.com`,
        personal_data: null
      })
      .eq('id', userId);
    
    // Schedule hard delete after 30 days
    await supabase.from('deletion_queue').insert({
      user_id: userId,
      scheduled_for: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }
  
  // Cookie consent
  static getCookieConsent(req: Request): CookieConsent {
    const cookies = req.headers.get('cookie') || '';
    const consent = cookies.match(/cookie_consent=([^;]+)/)?.[1];
    
    return consent ? JSON.parse(decodeURIComponent(consent)) : {
      necessary: true,
      analytics: false,
      marketing: false
    };
  }
}

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}