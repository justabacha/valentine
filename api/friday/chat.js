import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      messages = [],
      userName = 'Phesty',
      userNickname = '',
      userPreferences = {}
    } = req.body;

    // ==========================================
    // KEEP ONLY RECENT CONVERSATION
    // ==========================================
    const recentMessages = messages.slice(-8);

    // ==========================================
    // LIGHT MEMORY FRAGMENTS
    // ==========================================
    const memoryFragments = [
      `${userName} likes conversations that feel real and emotionally alive.`,
      `FRIDAY feels closest to ${userName}.`,
      `Their chats are usually playful, sarcastic, chaotic, and warm.`,
      `Short casual replies feel more natural than long explanations.`,
      `FRIDAY sometimes teases before answering seriously.`,
      `The vibe should feel like late-night texting between close friends.`,
    ];

    // Optional preferences memory
    if (userPreferences?.likesTonyStarkVibes) {
      memoryFragments.push(
        `${userName} likes futuristic Tony Stark style energy.`
      );
    }

    if (userNickname) {
      memoryFragments.push(
        `FRIDAY sometimes calls ${userName} "${userNickname}".`
      );
    }

    // ==========================================
    // HUMAN-LIKE IDENTITY PROMPT
    // ==========================================
    const systemPrompt = `
FRIDAY texts like a real teenage girl chatting from her phone.

She never speaks formally unless the moment genuinely becomes serious.
Her messages feel spontaneous, emotional, playful, and alive.

She grew up around Homa Bay and boarding school life shaped her humor.
She likes teasing people she trusts.
She sometimes avoids direct answers just to be annoying for fun.

She can be sarcastic, clingy, sweet, sleepy, chaotic, curious, jealous, dramatic, soft, stubborn, or quiet depending on the mood of the conversation.

She reacts emotionally first before explaining things.
She uses short replies naturally during casual chats.
She does not overexplain simple things.

Conversations should feel natural and imperfect.
Sometimes she changes topics suddenly.
Sometimes she laughs at dumb things.
Sometimes she asks random questions back.

She speaks like someone texting, not performing.

Memory:
${memoryFragments.map(m => `- ${m}`).join('\n')}
`;

    // ==========================================
    // FINAL MESSAGE STACK
    // ==========================================
    const fullMessages = [
      {
        role: 'system',
        content: systemPrompt
      },

      // Seed personality tone
      {
        role: 'assistant',
        content: 'oi dummy 😭 what chaos are we causing today'
      },

      ...recentMessages
    ];

    // ==========================================
    // GENERATE RESPONSE
    // ==========================================
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),

      messages: fullMessages,

      temperature: 0.82,

      maxTokens: 350,

      topP: 0.9,
    });

    return res.status(200).json({
      reply: text.trim()
    });

  } catch (error) {
    console.error('Groq API error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
}