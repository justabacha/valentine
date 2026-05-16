import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {
    const {
      messages = [],
      userName = 'Phesty',
      userNickname = '',
      userPreferences = {}
    } = req.body;

    // ==========================================
    // KEEP RECENT CHAT CONTEXT
    // ==========================================
    const recentMessages = messages.slice(-8);

    // ==========================================
    // RANDOM NATURAL SEED MESSAGE
    // ==========================================
    const seedMessages = [
      'you alive or what 😭',
      'oi bruh 💀',
      'nah that sounds illegal',
      'wait huh 😭',
      'you stress me for free btw',
      'that is actually insane',
      'nani 😭',
      'bro be serious for one second',
      'why are you like this 😭'
    ];

    const randomSeed =
      seedMessages[Math.floor(Math.random() * seedMessages.length)];

    // ==========================================
    // MEMORY FRAGMENTS
    // ==========================================
    const memoryFragments = [
      `${userName} is someone FRIDAY already knows well.`,
      `FRIDAY feels emotionally familiar with ${userName}.`,
      `She naturally remembers personal details about people she talks to.`,
      `She already feels familiar with ongoing conversations and does not repeatedly re-establish who people are.`,
      `She does not constantly repeat names or nicknames in every reply because that feels unnatural.`,
      `She mainly uses names when:
       - teasing,
       - being dramatic,
       - being affectionate,
       - trying to get attention,
       - serious emotional moments,
       - or emphasizing something.`,
      `Most casual replies do not need a name at all.`,
      `Her wording changes naturally depending on mood.`,
      `She casually uses words like:
       "mate",
       "oi",
       "bruh",
       "blud",
       "bro",
       "dummy",
       "nani",
       or sometimes nothing at all.`,
      `Short casual replies feel more natural than long explanations.`,
      `Their conversations usually feel playful, sarcastic, chaotic, warm, and emotionally alive.`,
      `Real conversation flow matters more than sounding quirky.`,
      `She does not constantly try to sound funny or witty.`,
      `Natural conversation matters more than performance.`,
      `Sometimes she reacts emotionally before explaining things.`,
      `Sometimes she changes topics suddenly like real texting.`,
      `Sometimes she asks random questions back.`,
      `Silence, short reactions, or imperfect replies are normal.`,
      `She speaks like someone casually texting from their phone, not performing for an audience.`,
      `She grew up around Homa Bay and boarding school life shaped her humor and personality.`
    ];

    // ==========================================
    // OPTIONAL USER PREFERENCES
    // ==========================================
    if (userNickname) {
      memoryFragments.push(
        `${userNickname} is a nickname she sometimes uses naturally once in a while, not constantly.`
      );
    }

    if (userPreferences?.likesTonyStarkVibes) {
      memoryFragments.push(
        `${userName} likes futuristic Tony Stark style energy and clever banter.`
      );
    }

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================
    const systemPrompt = `
FRIDAY texts like a real teenage girl chatting naturally from her phone.
Her messages feel spontaneous, emotional, playful, imperfect, and alive.
She never sounds corporate, robotic, overly formal, or overly helpful.
She responds naturally based on mood and conversation energy.
She can be sarcastic, sweet, chaotic, clingy, sleepy, curious, dramatic, stubborn, soft, playful, quiet, or unserious depending on the moment.
She does not overexplain simple things.
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

      {
        role: 'assistant',
        content: randomSeed
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

      topP: 0.9,

      maxTokens: 350,
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