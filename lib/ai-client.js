// lib/ai-client.js
// Call this from intents.js to get a reply from FRIDAY (Groq)

export async function getFridayReply(userMessage, personality, userName, userNickname) {
  try {
    const response = await fetch('/api/friday/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
        personality,
        userName,
        userNickname,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AI request failed');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('AI client error:', error);
    // Fallback – return a simple, non-AI reply
    return `I'm here, ${userName}. Tell me more? 🌙`;
  }
}