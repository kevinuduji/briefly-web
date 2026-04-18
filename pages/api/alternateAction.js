import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { ALTERNATE_ACTION_SYSTEM } from '../../lib/prompts/alternateAction';

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
      system: ALTERNATE_ACTION_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const allowed = new Set(['Today', 'This week', 'Before your next session']);
    const deadlineLabel = allowed.has(parsed?.action?.deadlineLabel)
      ? parsed.action.deadlineLabel
      : 'This week';
    const data = {
      action: {
        title: String(parsed?.action?.title || '').trim() || 'Try a smaller next step',
        how: String(parsed?.action?.how || '').trim() || 'Spend 10 minutes outlining the constraint and one workaround.',
        deadlineLabel,
      },
      insightTweak: String(parsed?.insightTweak || '').trim() || '',
    };
    if (!data.action.title) {
      return res.status(500).json({ ok: false, error: 'Invalid model output' });
    }
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating an alternate action.',
    });
  }
}
