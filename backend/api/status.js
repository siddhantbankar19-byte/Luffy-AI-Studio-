import { fal } from '@fal-ai/client';

const MODELS = {
  text: 'fal-ai/pika/v2.2/text-to-video',
  image: 'fal-ai/pika/v2.2/image-to-video'
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.FAL_KEY) return res.status(500).json({ error: 'FAL_KEY is not configured' });

  try {
    const id = String(req.query.id || '');
    const mode = String(req.query.mode || 'text');

    if (!id) return res.status(400).json({ error: 'Request id is required' });
    if (!MODELS[mode]) return res.status(400).json({ error: 'Invalid mode' });

    fal.config({ credentials: process.env.FAL_KEY });

    const queueStatus = await fal.queue.status(MODELS[mode], {
      requestId: id,
      logs: false
    });

    if (queueStatus.status === 'COMPLETED') {
      const result = await fal.queue.result(MODELS[mode], {
        requestId: id
      });

      return res.status(200).json({
        status: 'COMPLETED',
        videoUrl: result?.data?.video?.url || null
      });
    }

    if (queueStatus.status === 'FAILED') {
      return res.status(200).json({ status: 'FAILED' });
    }

    return res.status(200).json({
      status: queueStatus.status || 'IN_PROGRESS',
      queuePosition: queueStatus.queue_position ?? null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || 'Status check failed'
    });
  }
}
