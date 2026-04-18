import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { SUGGESTIONS_SYSTEM } from '../../lib/prompts/suggestions';

function normalizeItems(data) {
  const raw = Array.isArray(data?.items) ? data.items : [];
  const allowedEffort = new Set(['small', 'medium', 'large']);
  return raw
    .map((it) => ({
      title: String(it?.title || '').trim(),
      why: String(it?.why || '').trim(),
      effort: allowedEffort.has(it?.effort) ? it.effort : 'medium',
    }))
    .filter((it) => it.title && it.why)
    .slice(0, 5);
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
      system: SUGGESTIONS_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const items = normalizeItems(parsed);
    return res.status(200).json({ ok: true, data: { items } });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating suggestions.',
    });
  }
}
