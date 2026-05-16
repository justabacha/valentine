// lib/ai-client.js
// Calls the Vercel function to get a reply from FRIDAY (Groq)
export async function getFridayReply(messages, userName, userNickname, userPreferences = null) {
  try {
    const response = await fetch('/api/friday/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        userName,
        userNickname,
        userPreferences,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('AI client error:', error);
    // Graceful fallback – never leave the user without a reply
    return `I'm right here, ${userName}. Tell me what's on your mind? 🌙`;
  }
}