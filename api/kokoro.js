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

  const KOKORO_API_URL = 'https://kokoro-web-production-7432.up.railway.app/api/v1/audio/speech';

  try {
    const kokoroRes = await fetch(KOKORO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KOKORO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'model_uint8',           
        input: text,
        voice: 'af_heart',
      }),
    });

    if (!kokoroRes.ok) {
      const errorText = await kokoroRes.text();
      console.error(`Kokoro error (${kokoroRes.status}): ${errorText}`);
      return res.status(kokoroRes.status).json({ error: 'TTS service failed.' });
    }

    const audioBuffer = await kokoroRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('Kokoro proxy error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}