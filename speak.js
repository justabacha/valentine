// api/speak.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body safely
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const text = body.text;

  if (!text) {
    return res.status(400).json({ error: 'Missing text field' });
  }

  // ---------- PRIMARY: Murf AI ----------
  const murfKey = process.env.MURF_API_KEY;
  const murfVoice = process.env.MURF_VOICE_ID;      // e.g., "Peter"
  // Using the correct parameter name based on the API docs
  const murfModelVersion = 'GEN2';                   // Use the high-quality Gen2 model

  if (murfKey && murfVoice) {
    try {
      const murfResponse = await fetch('https://api.murf.ai/v1/speech/generate', {
        method: 'POST',
        headers: {
          'api-key': murfKey,
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({
  text: text,
  voiceId: "en-US-marcus",     
  modelVersion: "GEN2",        
  style: 'conversational',
  rate: 0,
  pitch: 0,
  format: 'MP3',
  channelType: 'MONO',
  encodeAsBase64: false,
}),
      });

      if (murfResponse.ok) {
        const murfData = await murfResponse.json();
        const audioUrl = murfData.audioFile;
        const audioResponse = await fetch(audioUrl);
        const audioBuffer = await audioResponse.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(Buffer.from(audioBuffer));
      } else {
        const errorText = await murfResponse.text();
        console.error(`Murf AI error (${murfResponse.status}):`, errorText);
      }
    } catch (err) {
      console.error('Murf AI exception:', err.message);
    }
  } else {
    console.warn('Missing MURF_API_KEY or MURF_VOICE_ID');
  }

  // ---------- FALLBACK: Edge TTS (dynamic import to avoid ESM error) ----------
  try {
    const { synthesize: edgeTTS } = await import('@echristian/edge-tts');
    const edgeResult = await edgeTTS({
      text: text,
      voice: 'en-US-JennyNeural',                   // Microsoft's high-quality neural voice
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
    });

    let audioBuffer;
    if (Buffer.isBuffer(edgeResult.audio)) {
      audioBuffer = edgeResult.audio;
    } else if (edgeResult.audio instanceof Uint8Array) {
      audioBuffer = Buffer.from(edgeResult.audio);
    } else {
      throw new Error('Unexpected audio format');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(audioBuffer);
  } catch (err) {
    console.error('Edge TTS failed:', err.message);
    return res.status(500).json({ error: 'All TTS engines failed, mate' });
  }
}