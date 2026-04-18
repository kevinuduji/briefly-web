import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { PROCESS_SYSTEM } from '../../lib/prompts/processPrompt';

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function normalizeDeadline(v) {
  const allowed = new Set(['Today', 'This week', 'Before your next session']);
  return allowed.has(v) ? v : 'This week';
}

function normalizeAction(a) {
  return {
    title: String(a?.title || '').trim(),
    how: String(a?.how || '').trim(),
    deadlineLabel: normalizeDeadline(a?.deadlineLabel),
  };
}

function normalizeProcess(data, { singleTurn } = {}) {
  const primary = normalizeAction(data?.action);
  const extrasRaw =
    singleTurn ? [] : Array.isArray(data.extraActions) ? data.extraActions : [];
  const primaryTitle = primary.title.toLowerCase();
  const extras = extrasRaw
    .map((a) => normalizeAction(a))
    .filter((a) => a.title && a.how)
    .filter((a) => a.title.toLowerCase() !== primaryTitle)
    .filter((a, i, arr) => arr.findIndex((x) => x.title.toLowerCase() === a.title.toLowerCase()) === i)
    .slice(0, 2);

  const signals = Array.isArray(data.signals) ? data.signals.slice(0, 5) : [];
  const moodScore = clamp(Math.round(Number(data.moodScore) || 3), 1, 5);
  const dayScore = clamp(Math.round(Number(data.dayScore) || 55), 0, 100);
  return {
    headline: String(data.headline || '').trim() || 'Today, in one line',
    insight: String(data.insight || '').trim(),
    action: {
      title: primary.title || 'Pick one next step',
      how: primary.how || 'Write down the smallest move you can make in 10 minutes.',
      deadlineLabel: primary.deadlineLabel,
    },
    extraActions: extras,
    signals: signals
      .map((s) => ({
        direction: ['up', 'down', 'neutral', 'flag'].includes(s.direction) ? s.direction : 'neutral',
        sentence: String(s.sentence || '').trim(),
        category: String(s.category || 'owner').trim() || 'owner',
      }))
      .filter((s) => s.sentence.length > 0),
    moodScore,
    dayScore,
    followUpQuestion:
      data.followUpQuestion == null ? null : String(data.followUpQuestion).trim() || null,
    patternNote: singleTurn
      ? null
      : data.patternNote == null
        ? null
        : String(data.patternNote).trim() || null,
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const singleTurn = Boolean(body.singleTurn);
    const raw = await chatJson({
      system: PROCESS_SYSTEM,
      user: JSON.stringify(body, null, 2),
    });
    const parsed = parseJsonObject(raw);
    const data = normalizeProcess(parsed, { singleTurn });
    if (!data.insight) {
      return res.status(500).json({ ok: false, error: 'Invalid model output' });
    }
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'Something went wrong turning your update into an insight.',
    });
  }
}
