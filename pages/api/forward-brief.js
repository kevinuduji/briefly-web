import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { FORWARD_BRIEF_SYSTEM } from '../../lib/prompts/forwardBriefPrompt';

function normalizeForwardBrief(data) {
  return {
    observation: String(data?.observation || '').trim(),
    preparationAction: String(data?.preparationAction || '').trim(),
    focusQuestion: String(data?.focusQuestion || '').trim(),
  };
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
      system: FORWARD_BRIEF_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const data = normalizeForwardBrief(parsed);
    if (!data.observation || !data.preparationAction || !data.focusQuestion) {
      return res.status(500).json({ ok: false, error: 'Invalid model output' });
    }
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating your forward brief.',
    });
  }
}
