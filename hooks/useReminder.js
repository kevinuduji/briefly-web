import { useMemo } from 'react';

function normalizeDeadline(label) {
  const t = String(label || '')
    .trim()
    .toLowerCase();
  if (t === 'today') return 'today';
  if (t === 'this week') return 'this_week';
  if (t === 'before your next session') return 'before_next';
  return null;
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameLocalDay(a, b) {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

function addLocalDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function atHourNextEligibleEvening(now, hour24, minute) {
  const candidate = new Date(now);
  candidate.setHours(hour24, minute, 0, 0);
  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
    candidate.setHours(hour24, minute, 0, 0);
  }
  return candidate;
}

function tomorrowAtHour(now, hour24, minute) {
  const d = addLocalDays(now, 1);
  d.setHours(hour24, minute, 0, 0);
  return d;
}

function formatClock(dt) {
  return dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Maps process/deadline labels to a concrete reminder moment + human label.
 */
export function computeReminderFromDeadline(deadlineLabel) {
  const kind = normalizeDeadline(deadlineLabel);
  if (!kind) {
    return { reminderTime: null, reminderLabel: null };
  }

  const now = new Date();

  if (kind === 'before_next') {
    const t = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return { reminderTime: t, reminderLabel: 'In 24 hours' };
  }

  if (kind === 'this_week') {
    const t = tomorrowAtHour(now, 9, 0);
    return { reminderTime: t, reminderLabel: `Tomorrow at ${formatClock(t)}` };
  }

  const t = atHourNextEligibleEvening(now, 20, 0);
  if (sameLocalDay(t, now)) {
    return { reminderTime: t, reminderLabel: `Tonight at ${formatClock(t)}` };
  }
  return { reminderTime: t, reminderLabel: `Tomorrow at ${formatClock(t)}` };
}

/**
 * @param {string | null | undefined} deadlineLabel Primary action deadlineLabel from insight ("Today" | "This week" | "Before your next session")
 * @returns {{ reminderTime: Date | null, reminderLabel: string | null, reminderSet: boolean }}
 */
export function useReminder(deadlineLabel) {
  return useMemo(() => {
    const { reminderTime, reminderLabel } = computeReminderFromDeadline(deadlineLabel);
    return {
      reminderTime,
      reminderLabel,
      reminderSet: Boolean(reminderTime),
    };
  }, [deadlineLabel]);
}
