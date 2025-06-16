// ===================================
// OPENAI MESSAGE REWRITING API
// ===================================

// app/api/rewrite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Request validation schema
const rewriteSchema = z.object({
  message: z.string().min(10).max(1000),
  tone: z.enum([
    'formal', 'friendly', 'assertive', 'apologetic',
    'urgent', 'diplomatic', 'casual', 'confident',
    'empathetic', 'direct', 'collaborative', 'grateful'
  ]),
  userId: z.string().uuid().optional(),
  context: z.object({
    recipientRole: z.string().optional(),
    urgencyLevel: z.enum(['low', 'medium', 'high']).optional(),
    relationship: z.enum(['new', 'established', 'close']).optional()
  }).optional()
});

// Tone configurations with detailed prompts
const TONE_CONFIGS = {
  formal: {
    name: "Formal",
    systemPrompt: "You are a professional business communication expert. Rewrite messages with utmost professionalism, using formal language, proper salutations, and a respectful tone.",
    style: "Use 'Dear', proper titles, formal vocabulary, and professional closings.",
    temperature: 0.3
  },
  friendly: {
    name: "Friendly",
    systemPrompt: "You are a warm, approachable communication coach. Rewrite messages to sound friendly and personable while maintaining professionalism.",
    style: "Use conversational tone, 'Hi' greetings, positive language, and warm closings.",
    temperature: 0.5
  },
  assertive: {
    name: "Assertive",
    systemPrompt: "You are a confident business leader. Rewrite messages to be clear, direct, and assertive without being aggressive.",
    style: "Use strong action words, clear statements, and confident language.",
    temperature: 0.4
  },
  apologetic: {
    name: "Apologetic",
    systemPrompt: "You are an empathetic communicator. Rewrite messages to express sincere apology and take responsibility appropriately.",
    style: "Use apologetic phrases, acknowledge impact, and show genuine concern.",
    temperature: 0.4
  },
  urgent: {
    name: "Urgent",
    systemPrompt: "You are a crisis communication expert. Rewrite messages to convey urgency and prompt action.",
    style: "Use 'URGENT' markers, action-oriented language, clear deadlines, and brief sentences.",
    temperature: 0.3
  },
  diplomatic: {
    name: "Diplomatic",
    systemPrompt: "You are a skilled diplomat. Rewrite messages to be tactful, balanced, and considerate of all perspectives.",
    style: "Use neutral language, acknowledge different viewpoints, and suggest collaborative solutions.",
    temperature: 0.4
  },
  casual: {
    name: "Casual",
    systemPrompt: "You are a relaxed colleague. Rewrite messages in a casual, easy-going manner while staying professional.",
    style: "Use informal greetings, contractions, and conversational language.",
    temperature: 0.6
  },
  confident: {
    name: "Confident",
    systemPrompt: "You are a successful executive. Rewrite messages to exude confidence and leadership.",
    style: "Use definitive statements, showcase expertise, and project authority.",
    temperature: 0.4
  },
  empathetic: {
    name: "Empathetic",
    systemPrompt: "You are an emotional intelligence expert. Rewrite messages to show deep understanding and empathy.",
    style: "Acknowledge feelings, show understanding, and offer support.",
    temperature: 0.5
  },
  direct: {
    name: "Direct",
    systemPrompt: "You are a no-nonsense communicator. Rewrite messages to be extremely clear and to the point.",
    style: "Use bullet points, short sentences, and eliminate fluff.",
    temperature: 0.2
  },
  collaborative: {
    name: "Collaborative",
    systemPrompt: "You are a team builder. Rewrite messages to foster collaboration and teamwork.",
    style: "Use 'we' language, invite input, and emphasize shared goals.",
    temperature: 0.5
  },
  grateful: {
    name: "Grateful",
    systemPrompt: "You are an appreciation expert. Rewrite messages to express genuine gratitude and recognition.",
    style: "Use thankful language, acknowledge specific contributions, and show appreciation.",
    temperature: 0.5
  }
};

// Rate limiting
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimiter.get(identifier);
  
  if (!limit || now > limit.resetTime) {
    rateLimiter.set(identifier, {
      count: 1,
      resetTime: now + 60 * 1000 // 1 minute window
    });
    return true;
  }
  
  if (limit.count >= 10) { // 10 requests per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// Main API handler
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const body = await req.json();
    const validation = rewriteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { message, tone, userId, context } = validation.data;
    const userIp = req.headers.get('x-forwarded-for') || 'anonymous';
    
    // Rate limiting
    if (!checkRateLimit(userId || userIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Check user subscription and limits
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .single();
        
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Check if user has access to premium tones
      const isPremiumTone = !['formal', 'friendly', 'assertive', 'apologetic'].includes(tone);
      if (isPremiumTone && user.plan === 'free') {
        return NextResponse.json(
          { error: 'This tone requires a Pro subscription' },
          { status: 403 }
        );
      }
      
      // Check daily limits for free users
      if (user.plan === 'free') {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await supabase
          .from('usage_logs')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', today);
          
        if (count >= 3) {
          return NextResponse.json(
            { 
              error: 'Daily limit reached',
              upgradeUrl: '/pricing'
            },
            { status: 403 }
          );
        }
      }
    }
    
    // Get tone configuration
    const toneConfig = TONE_CONFIGS[tone];
    
    // Construct the prompt
    const systemPrompt = `${toneConfig.systemPrompt}

Style Guidelines: ${toneConfig.style}

Context:
- Recipient Role: ${context?.recipientRole || 'Boss/Manager'}
- Urgency Level: ${context?.urgencyLevel || 'medium'}
- Relationship: ${context?.relationship || 'established'}

Important Rules:
1. Maintain the core message and intent
2. Use appropriate salutation and closing
3. Be concise but complete
4. Fix any grammar or spelling errors
5. Ensure professional appropriateness
6. Include [Boss Name] placeholder for personalization
7. Include [Your Name] placeholder for signature`;

    const userPrompt = `Please rewrite this message in a ${tone} tone:

"${message}"

Provide only the rewritten message without any explanation or meta-commentary.`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: toneConfig.temperature,
      max_tokens: 500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });
    
    const rewrittenMessage = completion.choices[0].message.content || '';
    
    // Log usage if user is authenticated
    if (userId) {
      await supabase.from('usage_logs').insert({
        user_id: userId,
        action: 'message_rewritten',
        original_message: message.substring(0, 500), // Store first 500 chars
        rewritten_message: rewrittenMessage.substring(0, 500),
        tone,
        created_at: new Date().toISOString()
      });
    }
    
    // Calculate improvement metrics
    const metrics = calculateMetrics(message, rewrittenMessage);
    
    return NextResponse.json({
      success: true,
      original: message,
      rewritten: rewrittenMessage,
      tone: toneConfig.name,
      metrics,
      tokensUsed: completion.usage?.total_tokens || 0
    });
    
  } catch (error) {
    console.error('Rewrite API error:', error);
    
    // Handle specific errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to rewrite message' },
      { status: 500 }
    );
  }
}

// Calculate improvement metrics
function calculateMetrics(original: string, rewritten: string) {
  // Word count
  const originalWords = original.split(/\s+/).length;
  const rewrittenWords = rewritten.split(/\s+/).length;
  
  // Professionalism score (simple heuristic)
  const professionalWords = [
    'please', 'thank you', 'apologize', 'appreciate', 
    'regarding', 'concerning', 'furthermore', 'sincerely'
  ];
  
  const professionalismScore = professionalWords.reduce((score, word) => {
    return score + (rewritten.toLowerCase().includes(word) ? 10 : 0);
  }, 0);
  
  // Clarity improvements
  const clarityImprovements = {
    removedFillers: original.match(/\b(um|uh|like|you know|basically|actually)\b/gi)?.length || 0,
    improvedStructure: rewritten.includes('\n') || rewritten.includes('•'),
    addedPoliteness: rewritten.match(/\b(please|thank you|appreciate)\b/gi)?.length || 0
  };
  
  return {
    wordCount: {
      original: originalWords,
      rewritten: rewrittenWords,
      change: rewrittenWords - originalWords
    },
    professionalismScore: Math.min(100, professionalismScore),
    clarityImprovements,
    readingTime: Math.ceil(rewrittenWords / 200) // minutes
  };
}

// ===================================
// BATCH PROCESSING FOR TEMPLATES
// ===================================

// app/api/rewrite/batch/route.ts
export async function POST(req: NextRequest) {
  try {
    const { templates, tone, userId } = await req.json();
    
    // Check if user has Pro+ plan
    const { data: user } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();
      
    if (user?.plan !== 'pro_plus') {
      return NextResponse.json(
        { error: 'Batch processing requires Pro+ plan' },
        { status: 403 }
      );
    }
    
    // Process templates in parallel
    const results = await Promise.all(
      templates.map(async (template) => {
        try {
          const response = await processTemplate(template, tone);
          return { success: true, ...response };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })
    );
    
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Batch processing failed' },
      { status: 500 }
    );
  }
}

// ===================================
// SMART SUGGESTIONS API
// ===================================

// app/api/suggestions/route.ts
export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json();
    
    // Analyze message intent
    const analysis = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Analyze this workplace message and suggest the best tone and improvements."
        },
        {
          role: "user",
          content: `Message: "${message}"
          
          Provide:
          1. Detected intent (sick day, time off request, deadline extension, etc.)
          2. Recommended tone
          3. Key improvements needed
          4. Urgency level
          
          Format as JSON.`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const suggestions = JSON.parse(analysis.choices[0].message.content || '{}');
    
    return NextResponse.json({
      intent: suggestions.intent || 'general',
      recommendedTone: suggestions.recommendedTone || 'formal',
      improvements: suggestions.improvements || [],
      urgencyLevel: suggestions.urgencyLevel || 'medium',
      templates: getTemplatesForIntent(suggestions.intent)
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

// Get relevant templates based on intent
function getTemplatesForIntent(intent: string) {
  const templateMap = {
    'sick_day': [
      "I'm not feeling well today and need to take a sick day",
      "I woke up with flu symptoms and won't be able to come in",
      "I need to take a sick day for a medical appointment"
    ],
    'time_off': [
      "I'd like to request time off for [dates]",
      "I need to use some of my PTO days next week",
      "Can I schedule vacation time for [dates]?"
    ],
    'deadline_extension': [
      "I need more time to complete the [project]",
      "Can we extend the deadline for [task]?",
      "I'm running behind on [project] and need an extension"
    ],
    'meeting_reschedule': [
      "Can we reschedule our meeting?",
      "I have a conflict with our scheduled meeting",
      "Something urgent came up, can we move our meeting?"
    ]
  };
  
  return templateMap[intent] || [];
}

// ===================================
// TONE PREVIEW API (Real-time)
// ===================================

// app/api/preview/route.ts
export async function POST(req: NextRequest) {
  try {
    const { message, fromTone, toTone } = await req.json();
    
    // Quick preview using GPT-3.5 for speed
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Show how this message would change from ${fromTone} to ${toTone} tone. Provide a brief before/after comparison.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });
    
    return NextResponse.json({
      preview: completion.choices[0].message.content
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Preview generation failed' },
      { status: 500 }
    );
  }
}

// ===================================
// EXPORT CONFIGURATIONS
// ===================================

export const openAIConfig = {
  // Model settings for different use cases
  models: {
    premium: 'gpt-4',        // Best quality for paid users
    standard: 'gpt-3.5-turbo', // Fast and cheap for free users
    analysis: 'gpt-3.5-turbo'  // Quick analysis tasks
  },
  
  // Token limits by plan
  tokenLimits: {
    free: 500,
    pro: 1000,
    pro_plus: 2000
  },
  
  // Caching settings
  cache: {
    ttl: 3600, // 1 hour
    maxSize: 1000 // entries
  }
};