// pages/api/rewrite.js
import OpenAI from 'openai';
import { supabase } from '../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, tone, userId } = req.body;

  try {
    // Check user's daily usage if they're on free plan
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('plan')
        .eq('id', userId)
        .single();
        
      if (user?.plan === 'free') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { count } = await supabase
          .from('usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString());
          
        if (count >= 3) {
          return res.status(403).json({ 
            error: 'Daily limit reached',
            upgradeUrl: '/pricing' 
          });
        }
      }
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional communication expert. Rewrite the following message in a ${tone} tone for workplace communication. Make it professional and appropriate.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const rewrittenMessage = completion.choices[0].message.content;

    // Track usage
    if (userId) {
      await supabase.from('usage_logs').insert({
        user_id: userId,
        action: 'message_rewritten',
        original_message: message.substring(0, 500),
        rewritten_message: rewrittenMessage.substring(0, 500),
        tone
      });
    }

    res.status(200).json({
      success: true,
      rewritten: rewrittenMessage
    });
  } catch (error) {
    console.error('Rewrite error:', error);
    res.status(500).json({ error: 'Failed to rewrite message' });
  }
}