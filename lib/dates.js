export function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return formatLocalDate(new Date());
}

export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToDateStr(dateStr, deltaDays) {
  const dt = parseLocalDate(dateStr);
  dt.setDate(dt.getDate() + deltaDays);
  return formatLocalDate(dt);
}

export function yesterdayStr() {
  return addDaysToDateStr(todayStr(), -1);
}

export function computeStreak(memory) {
  const dates = new Set(memory.map((m) => m.date));
  if (dates.size === 0) return 0;
  const today = todayStr();
  let streak = 0;
  let cursor = new Date();
  if (!dates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (let i = 0; i < 400; i += 1) {
    const key = formatLocalDate(cursor);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function dayQualityLabel(dayScore) {
  const n = Number(dayScore) || 0;
  if (n >= 70) return 'Strong day';
  if (n >= 40) return 'Mixed day';
  return 'Tough day';
}
