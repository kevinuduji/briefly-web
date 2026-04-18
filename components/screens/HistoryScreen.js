import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SecondaryButton } from '../ui/SecondaryButton';
import { parseLocalDate, todayStr } from '../../lib/dates';

const DayScoreTrendChart = dynamic(() => import('../history/DayScoreTrendChart'), { ssr: false });

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}

function dateParts(dateStr) {
  const d = parseLocalDate(dateStr);
  return {
    month: d.toLocaleString('en-US', { month: 'short' }),
    day: String(d.getDate()),
  };
}

function checkInSuffix(memory, entry) {
  const idx = memory.findIndex((x) => x.id === entry.id);
  if (idx === -1) return '';
  const sameDay = memory.filter((x) => x.date === entry.date).length;
  if (sameDay <= 1) return '';
  const rank = memory.slice(0, idx + 1).filter((x) => x.date === entry.date).length;
  return rank === 1 ? 'Latest' : `#${rank}`;
}

function scoreColor(score) {
  const n = Number(score) || 0;
  if (n >= 70) return 'text-briefly-green';
  if (n >= 40) return 'text-briefly-amber';
  return 'text-briefly-red';
}

function statusPill(status) {
  if (status === 'done') {
    return <span className="rounded-full bg-briefly-greenBg px-2 py-0.5 text-[11px] font-semibold text-briefly-green">✓ Done</span>;
  }
  if (status === 'skipped') {
    return <span className="rounded-full bg-briefly-page px-2 py-0.5 text-[11px] font-semibold text-briefly-muted">Skipped</span>;
  }
  return <span className="rounded-full bg-briefly-amberBg px-2 py-0.5 text-[11px] font-semibold text-briefly-amber">Pending</span>;
}

function outcomePill(label) {
  if (!label) return null;
  if (label === 'worked') {
    return (
      <span className="rounded-full bg-briefly-greenBg px-2 py-0.5 text-[11px] font-semibold text-briefly-green">
        ✓ Worked
      </span>
    );
  }
  if (label === 'partial') {
    return (
      <span className="rounded-full bg-briefly-amberBg px-2 py-0.5 text-[11px] font-semibold text-briefly-amber">
        ~ Partial
      </span>
    );
  }
  if (label === 'didnt-work') {
    return (
      <span className="rounded-full bg-briefly-redBg px-2 py-0.5 text-[11px] font-semibold text-briefly-red">
        ✗ Did not work
      </span>
    );
  }
  if (label === 'not-tried') {
    return (
      <span className="rounded-full bg-briefly-page px-2 py-0.5 text-[11px] font-semibold text-briefly-muted">Not tried</span>
    );
  }
  return null;
}

export function HistoryScreen() {
  const { navigate, memory, user, streak } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [weekly, setWeekly] = useState('');
  const [weeklyBusy, setWeeklyBusy] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');

  const todayKey = todayStr();

  const chartRows = useMemo(() => {
    const windowed = memory.slice(0, 14).reverse();
    return windowed.map((m, wi) => {
      const p = dateParts(m.date);
      const sameCount = windowed.filter((x) => x.date === m.date).length;
      const rank = windowed.slice(0, wi + 1).filter((x) => x.date === m.date).length;
      const label = sameCount > 1 ? `${p.month} ${p.day} (${rank})` : `${p.month} ${p.day}`;
      return { label, score: m.dayScore, id: m.id };
    });
  }, [memory]);

  useEffect(() => {
    if (memory.length < 7) return;
    let cancelled = false;
    (async () => {
      setWeeklyBusy(true);
      setWeeklyError('');
      try {
        const weekEntries = memory.slice(0, 7).map((m) => ({
          id: m.id,
          date: m.date,
          headline: m.headline,
          theOneThing: m.theOneThing,
          action: m.action,
          actionStatus: m.actionStatus,
          signals: m.signals,
          dayScore: m.dayScore,
          moodScore: m.moodScore,
        }));
        const data = await postJson('/api/weekly', { user, weekEntries });
        if (!cancelled) setWeekly(data.weeklyPattern);
      } catch (e) {
        if (!cancelled) setWeeklyError(e.message || 'Could not load weekly pattern.');
      } finally {
        if (!cancelled) setWeeklyBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memory, user]);

  return (
    <div className="mx-auto max-w-lg px-5 pb-16 pt-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full p-2 text-briefly-text hover:bg-briefly-surface"
          aria-label="Back"
          onClick={() => navigate('home')}
        >
          ←
        </button>
        <div className="flex flex-1 items-baseline justify-between gap-3">
          <p className="text-xl font-semibold text-briefly-text">Hustle Memory</p>
          <p className="text-xs text-briefly-muted">{memory.length} sessions logged</p>
        </div>
      </div>

      {memory.length >= 3 && (
        <div className="mt-8">
          <DayScoreTrendChart rows={chartRows} streak={streak} />
        </div>
      )}

      {memory.length >= 7 && (
        <div className="mt-8 rounded-card border border-briefly-border bg-briefly-greenBg p-4">
          <p className="text-sm font-semibold text-briefly-text">This Week&apos;s Pattern</p>
          {weeklyBusy && <p className="mt-2 text-xs text-briefly-muted">Synthesizing your week…</p>}
          {weeklyError && <p className="mt-2 text-xs text-briefly-red">{weeklyError}</p>}
          {!weeklyBusy && !weeklyError && weekly && <p className="mt-2 text-sm leading-relaxed text-briefly-text">{weekly}</p>}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {memory.map((m) => {
          const { month, day } = dateParts(m.date);
          const expanded = expandedId === m.id;
          const isToday = m.date === todayKey;
          const suffix = checkInSuffix(memory, m);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setExpandedId(expanded ? null : m.id)}
              className={`w-full rounded-card border text-left shadow-brieflyCard transition-colors ${
                isToday ? 'border-l-4 border-l-briefly-amber bg-briefly-amberBg border-briefly-border' : 'border-briefly-border bg-briefly-surface'
              }`}
            >
              <div className="flex items-stretch gap-3 p-4">
                <div className="w-16 shrink-0 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">{month}</p>
                  <p className="text-[28px] font-bold leading-none text-briefly-text">{day}</p>
                  {suffix && <p className="mt-1 text-[10px] font-semibold text-briefly-muted">{suffix}</p>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-briefly-text">{m.theOneThing}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs text-briefly-muted">{m.action.title}</p>
                    {outcomePill(m.action?.outcomeLabel)}
                    {statusPill(m.actionStatus)}
                  </div>
                </div>
                <div className={`w-12 shrink-0 text-right text-2xl font-bold ${scoreColor(m.dayScore)}`}>
                  {Math.round(m.dayScore)}
                </div>
              </div>
              {expanded && (
                <div className="space-y-3 border-t border-briefly-border px-4 pb-4 pt-3">
                  {m.action?.outcome && (
                    <div className="flex flex-wrap items-center gap-2">
                      {outcomePill(m.action?.outcomeLabel)}
                      <p className="text-xs text-briefly-text">{m.action.outcome}</p>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-briefly-text">{m.theOneThing}</p>
                  {Array.isArray(m.extraActions) && m.extraActions.length > 0 && (
                    <div className="rounded-card border border-briefly-border bg-briefly-page p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Also suggested</p>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-briefly-text">
                        {m.extraActions.map((a) => (
                          <li key={a.title}>{a.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(m.signals) && m.signals.length > 0 && (
                    <div className="space-y-2">
                      {m.signals.slice(0, 5).map((s, idx) => (
                        <p key={`${m.id}-sig-${idx}`} className="text-xs text-briefly-muted">
                          <span className="font-semibold text-briefly-text">{s.category}:</span> {s.sentence}
                        </p>
                      ))}
                    </div>
                  )}
                  {m.patternNote && (
                    <div className="rounded-card border border-briefly-border bg-briefly-amberBg p-3 text-sm text-briefly-text">
                      {m.patternNote}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {memory.length === 0 && (
        <div className="mt-10 rounded-card border border-briefly-border bg-briefly-surface p-6 text-center text-sm text-briefly-muted shadow-brieflyCard">
          Once you complete a few sessions, your timeline and trends will show up here.
        </div>
      )}

      <div className="mt-10">
        <SecondaryButton className="w-full" onClick={() => navigate('home')}>
          Back home
        </SecondaryButton>
      </div>
    </div>
  );
}
