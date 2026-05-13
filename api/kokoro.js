export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field.' });
  }

  const KOKORO_API_KEY = process.env.KOKORO_API_KEY;
  if (!KOKORO_API_KEY) {
    console.error('Missing KOKORO_API_KEY');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Try both possible endpoints
  const endpoints = [
    'https://kokoro-web-production-7432.up.railway.app/api/v1/audio/speech',
    'https://kokoro-web-production-7432.up.railway.app/v1/audio/speech'
  ];

  let lastError = null;

  for (const KOKORO_API_URL of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout (for cold start)

      const kokoroRes = await fetch(KOKORO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KOKORO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'model',
          input: text,
          voice: 'af_heart',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (kokoroRes.ok) {
        const audioBuffer = await kokoroRes.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(200).send(Buffer.from(audioBuffer));
      } else {
        lastError = `Status ${kokoroRes.status}`;
        const errorText = await kokoroRes.text();
        console.error(`Kokoro error (${kokoroRes.status}): ${errorText}`);
      }
    } catch (err) {
      lastError = err.message;
      console.error(`Endpoint ${KOKORO_API_URL} failed:`, err);
    }
  }

  res.status(502).json({ error: 'TTS service unavailable', details: lastError });
}