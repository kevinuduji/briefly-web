import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { OUTCOME_SYSTEM } from '../../lib/prompts/outcomePrompt';

const LABELS = new Set(['worked', 'partial', 'didnt-work', 'not-tried']);

function normalizeOutcome(data) {
  const outcome = String(data?.outcome || '').trim();
  let outcomeLabel = String(data?.outcomeLabel || '').trim();
  if (!LABELS.has(outcomeLabel)) {
    outcomeLabel = 'partial';
  }
  return { outcome: outcome || 'Outcome unclear from response.', outcomeLabel };
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
      system: OUTCOME_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const data = normalizeOutcome(parsed);
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong extracting your outcome.',
    });
  }
}
