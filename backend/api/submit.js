import { fal } from '@fal-ai/client';

const MODELS = {
  text: 'fal-ai/pika/v2.2/text-to-video',
  image: 'fal-ai/pika/v2.2/image-to-video'
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.FAL_KEY) return res.status(500).json({ error: 'FAL_KEY is not configured' });

  try {
    const {
      mode = 'text',
      prompt,
      aspectRatio = '9:16',
      resolution = '720p',
      duration = 5,
      imageDataUrl
    } = req.body || {};

    if (!MODELS[mode]) return res.status(400).json({ error: 'Invalid mode' });
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    if (!['720p', '1080p'].includes(resolution)) {
      return res.status(400).json({ error: 'Invalid resolution' });
    }
    if (![5, 10].includes(Number(duration))) {
      return res.status(400).json({ error: 'Invalid duration' });
    }
    if (mode === 'image' && !imageDataUrl) {
      return res.status(400).json({ error: 'Image is required' });
    }

    fal.config({ credentials: process.env.FAL_KEY });

    const input = mode === 'text'
      ? {
          prompt,
          aspect_ratio: ['9:16', '16:9', '1:1'].includes(aspectRatio) ? aspectRatio : '9:16',
          resolution,
          duration: Number(duration)
        }
      : {
          image_url: imageDataUrl,
          prompt,
          resolution,
          duration: Number(duration)
        };

    const submitted = await fal.queue.submit(MODELS[mode], { input });

    return res.status(200).json({
      requestId: submitted.request_id,
      model: MODELS[mode],
      mode
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || 'Generation submission failed'
    });
  }
}
