import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { CROSS_HUSTLE_OBSERVATION_SYSTEM } from '../../lib/prompts/crossHustleObservation';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!getOpenAI()) {
    return res.status(503).json({
      ok: false,
      error: 'MyHustle is not configured yet. Add OPENAI_API_KEY to .env.local.',
    });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const raw = await chatJson({
      system: CROSS_HUSTLE_OBSERVATION_SYSTEM,
      user: JSON.stringify(body, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const observation = String(parsed?.observation || '').trim();
    if (!observation) {
      return res.status(500).json({ ok: false, error: 'Invalid model output' });
    }
    return res.status(200).json({ ok: true, data: { observation } });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating the observation.',
    });
  }
}
