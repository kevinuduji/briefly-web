import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { PATTERNS_SYSTEM } from '../../lib/prompts/patternsPrompt';

function normalizePatterns(data) {
  const strengths = Array.isArray(data?.strengths)
    ? data.strengths.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 3)
    : [];
  const frictionsRaw = Array.isArray(data?.frictions) ? data.frictions : [];
  const frictions = frictionsRaw
    .map((f) => ({
      observation: String(f?.observation || '').trim(),
      sessionCount: Math.max(0, Math.round(Number(f?.sessionCount) || 0)),
    }))
    .filter((f) => f.observation && f.sessionCount > 0)
    .slice(0, 3);
  const decisionStyle =
    data?.decisionStyle == null ? null : String(data.decisionStyle).trim() || null;
  const completedActions = Math.max(0, Math.round(Number(data?.completedActions) || 0));
  const deferredActions = Math.max(0, Math.round(Number(data?.deferredActions) || 0));
  return {
    strengths,
    frictions,
    decisionStyle,
    completedActions,
    deferredActions,
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
      system: PATTERNS_SYSTEM,
      user: JSON.stringify(req.body ?? {}, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const data = normalizePatterns(parsed);
    if (data.strengths.length + data.frictions.length === 0) {
      return res.status(500).json({ ok: false, error: 'Invalid model output' });
    }
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong generating patterns.',
    });
  }
}
