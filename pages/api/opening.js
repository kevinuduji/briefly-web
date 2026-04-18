import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { OPENING_SYSTEM } from '../../lib/prompts/opening';

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
    const raw = await chatJson({
      system: OPENING_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const data = parseJsonObject(raw);
    if (!data.openingQuestion || typeof data.openingQuestion !== 'string') {
      return res.status(500).json({ ok: false, error: 'Invalid model output' });
    }
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating your opening question.',
    });
  }
}
