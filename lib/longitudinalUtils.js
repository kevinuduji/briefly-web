export function memoryChronological(memory) {
  if (!Array.isArray(memory)) return [];
  return [...memory].reverse();
}

export function normalizeMemoryAction(action) {
  const base = action && typeof action === 'object' ? action : {};
  return {
    title: String(base.title || '').trim(),
    how: String(base.how || '').trim(),
    deadline: String(base.deadline || base.deadlineLabel || 'This week').trim() || 'This week',
    markedDoneAt: base.markedDoneAt == null ? null : String(base.markedDoneAt),
    followUpDue:
      base.followUpDue == null || base.followUpDue === ''
        ? null
        : Number.isFinite(Number(base.followUpDue))
          ? Number(base.followUpDue)
          : null,
    outcome: base.outcome == null ? null : String(base.outcome),
    outcomeLabel: base.outcomeLabel == null ? null : String(base.outcomeLabel),
  };
}

export function migrateMemoryLongitudinal(memory) {
  if (!Array.isArray(memory)) return [];
  return memory.map((m) => ({
    ...m,
    action: normalizeMemoryAction(m.action),
  }));
}

export function buildOutcomeContextString(memory) {
  const rows = (memory || []).filter((m) => m.action?.outcomeLabel);
  if (rows.length < 5) return null;
  const counts = rows.reduce((acc, m) => {
    const k = m.action.outcomeLabel;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const countStr = Object.entries(counts)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const recent = rows
    .slice(0, 8)
    .map((m) => `"${m.action.title}" → ${m.action.outcome}`)
    .join(' | ');
  return `Tracked outcomes (${rows.length}): ${countStr}. Examples: ${recent}`;
}

export function buildPatternContextString(patternsDigest) {
  if (!patternsDigest || typeof patternsDigest !== 'string') return null;
  const t = patternsDigest.trim();
  return t.length ? t : null;
}
