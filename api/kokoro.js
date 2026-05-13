export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field.' });
  }

  // 2. Get the secret API key from environment variables (set in Vercel dashboard)
  const KOKORO_API_KEY = process.env.KOKORO_API_KEY;
  if (!KOKORO_API_KEY) {
    console.error('Missing KOKORO_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // 3. Your deployed Kokoro Web endpoint on Railway
  const KOKORO_API_URL = 'https://kokoro-web-production-7432.up.railway.app/api/v1/audio/speech';

  try {
    // 4. Call Kokoro API (OpenAI-compatible format)
    const kokoroRes = await fetch(KOKORO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KOKORO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: 'af_heart',     // you can change to other voices later
        // optional: speed, format etc.
      }),
    });

    if (!kokoroRes.ok) {
      const errorText = await kokoroRes.text();
      console.error(`Kokoro API error (${kokoroRes.status}): ${errorText}`);
      return res.status(kokoroRes.status).json({ error: 'TTS service failed.' });
    }

    // 5. Forward the audio file (MP3) back to the client
    const audioBuffer = await kokoroRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('Kokoro proxy error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}