// lib/personality-loader.js
let cachedPersonality = null;

export async function loadPersonality() {
  if (cachedPersonality) return cachedPersonality;

  try {
    const response = await fetch('/lib/personality/baroness.json');
    if (!response.ok) throw new Error('Failed to load personality');
    cachedPersonality = await response.json();
    return cachedPersonality;
  } catch (error) {
    console.error('Personality load error:', error);
    // Return a minimal default so the app doesn't break
    return {
      name: 'Baroness',
      tone: 'warm, caring, uses pet names like love',
      speakingStyle: 'short, with emojis',
      catchphrases: ['Hey love', 'You okay?'],
    };
  }
}