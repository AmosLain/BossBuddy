// src/services/rewriteService.js
import OpenAI from 'openai';
import { supabase, trackRewrite, checkDailyUsage } from '../lib/supabase';

// Initialize OpenAI with browser support
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for frontend usage
});

// Rewrite message with OpenAI
export async function rewriteMessage(message, tone, userId) {
  try {
    // Check daily usage for free users
    if (userId) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (!userData || userData.subscription_tier === 'free') {
        const usageCount = await checkDailyUsage(userId);
        if (usageCount >= 3) {
          return {
            success: false,
            error: 'Daily limit reached. Upgrade to Pro for unlimited rewrites.',
            upgradeUrl: '/pricing'
          };
        }
      }
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional communication expert. Rewrite the following message in a ${tone} tone for workplace communication. Keep it concise, professional, and appropriate. Maintain the core message while adjusting the tone.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const rewrittenMessage = completion.choices[0].message.content.trim();

    // Track usage in Supabase
    if (userId) {
      await trackRewrite(
        userId,
        message.substring(0, 500),
        rewrittenMessage.substring(0, 500),
        tone
      );
    }

    return {
      success: true,
      rewritten: rewrittenMessage
    };

  } catch (error) {
    console.error('Rewrite error:', error);
    
    // Handle specific error types
    if (error.message?.includes('401')) {
      return {
        success: false,
        error: 'Invalid API key. Please check your OpenAI API key.'
      };
    }
    
    if (error.message?.includes('429')) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      };
    }

    return {
      success: false,
      error: 'Failed to rewrite message. Please try again.'
    };
  }
}

// Tone definitions for better rewrites
export const TONE_PROMPTS = {
  formal: "Use formal business language with proper etiquette and professional courtesy.",
  friendly: "Use warm, approachable language while maintaining professionalism.",
  assertive: "Use confident, direct language that clearly states your position.",
  apologetic: "Use empathetic language that takes responsibility and shows understanding."
};