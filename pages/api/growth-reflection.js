import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { GROWTH_REFLECTION_SYSTEM } from '../../lib/prompts/growthReflectionPrompt';

function normalizeGrowth(data) {
  const thenQuote = data?.thenQuote == null ? null : String(data.thenQuote).trim() || null;
  const nowObservation = data?.nowObservation == null ? null : String(data.nowObservation).trim() || null;
  const reflectionPrompt = data?.reflectionPrompt == null ? null : String(data.reflectionPrompt).trim() || null;
  if (!thenQuote || !nowObservation || !reflectionPrompt) {
    return { thenQuote: null, nowObservation: null, reflectionPrompt: null };
  }
  return { thenQuote, nowObservation, reflectionPrompt };
}

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
      system: GROWTH_REFLECTION_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const data = normalizeGrowth(parsed);
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating your growth reflection.',
    });
  }
}
