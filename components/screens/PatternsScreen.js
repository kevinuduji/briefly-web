import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { SecondaryButton } from '../ui/SecondaryButton';
import { ThinkingAnimation } from '../session/ThinkingAnimation';
import { memoryChronological } from '../../lib/longitudinalUtils';
import { parseLocalDate } from '../../lib/dates';

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

function mondayIndexFromDateStr(dateStr) {
  const d = parseLocalDate(dateStr);
  const dow = d.getDay();
  return dow === 0 ? 6 : dow - 1;
}

function shortDateLabel(dateStr) {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildHabitWeeks(memory) {
  const byWeek = new Map();
  for (const m of memory) {
    const d = parseLocalDate(m.date);
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = t.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(t);
    monday.setDate(t.getDate() + diffToMon);
    const key = monday.toISOString().slice(0, 10);
    const cur = byWeek.get(key) || { monday, rowKey: key, cells: Array(7).fill(null) };
    const idx = mondayIndexFromDateStr(m.date);
    const score = Number(m.dayScore) || 0;
    cur.cells[idx] = cur.cells[idx] == null ? score : Math.max(cur.cells[idx], score);
    byWeek.set(key, cur);
  }
  const rows = Array.from(byWeek.values()).sort((a, b) => a.monday - b.monday);
  return rows.map((r, i) => ({ ...r, weekLabel: `Week ${i + 1}` }));
}

function cellColor(score) {
  if (score == null) return '#e1e3e5';
  if (score >= 70) return 'rgba(0, 128, 96, 0.8)';
  if (score >= 40) return 'rgba(185, 137, 0, 0.8)';
  return 'rgba(215, 44, 13, 0.8)';
}

export function PatternsScreen() {
  const {
    navigate,
    memory,
    user,
    setPatternsDigestFromPatterns,
    startLongitudinalVoiceSession,
  } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const chronological = useMemo(() => memoryChronological(memory), [memory]);
  const outcomeCount = useMemo(
    () => memory.filter((m) => m.action?.outcomeLabel).length,
    [memory]
  );

  const momentumRows = useMemo(() => {
    return chronological.map((m) => ({
      label: shortDateLabel(m.date),
      score: Math.round(Number(m.dayScore) || 0),
      id: m.id,
    }));
  }, [chronological]);

  const momentumStats = useMemo(() => {
    const scores = momentumRows.map((r) => r.score);
    if (!scores.length) return { max: 0, mean: 0, min: 0, trend: 'steady' };
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    let trend = 'steady';
    if (scores.length >= 6) {
      const last3 = scores.slice(-3);
      const prev3 = scores.slice(-6, -3);
      const a = last3.reduce((x, y) => x + y, 0) / 3;
      const b = prev3.reduce((x, y) => x + y, 0) / 3;
      if (b === 0) {
        trend = a > 0 ? 'up' : 'steady';
      } else {
        const ratio = a / b;
        if (ratio > 1.1) trend = 'up';
        else if (ratio < 0.9) trend = 'down';
        else trend = 'steady';
      }
    }
    return { max, mean, min, trend };
  }, [momentumRows]);

  const habitWeeks = useMemo(() => buildHabitWeeks(memory), [memory]);

  useEffect(() => {
    if (memory.length < 5) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const chrono = memoryChronological(memory);
        const payload = await postJson('/api/patterns', {
          user,
          memory: chrono,
        });
        if (!cancelled) {
          setData(payload);
          setPatternsDigestFromPatterns(payload);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load patterns.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memory, user, setPatternsDigestFromPatterns]);

  const trendLabel = () => {
    if (momentumStats.trend === 'up') {
      return <span className="text-sm font-semibold text-briefly-green">Trending up</span>;
    }
    if (momentumStats.trend === 'down') {
      return <span className="text-sm font-semibold text-briefly-amber">Worth attention</span>;
    }
    return <span className="text-sm font-semibold text-briefly-muted">Holding steady</span>;
  };

  if (memory.length < 5) {
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
          <p className="text-xl font-semibold text-briefly-text">How This Hustle Runs</p>
        </div>
        <div className="mt-10 rounded-card border border-briefly-border bg-briefly-surface p-6 text-center shadow-brieflyCard">
          <p className="text-sm font-medium text-briefly-text">Patterns unlock after five sessions.</p>
          <p className="mt-2 text-xs text-briefly-muted">Keep logging — MyHustle is building your longitudinal map.</p>
        </div>
        <div className="mt-8">
          <SecondaryButton className="w-full" onClick={() => navigate('home')}>
            Back home
          </SecondaryButton>
        </div>
      </div>
    );
  }

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
        <p className="text-xl font-semibold text-briefly-text">How This Hustle Runs</p>
      </div>

      {loading && (
        <div className="mt-10">
          <ThinkingAnimation />
          <p className="mt-4 text-center text-xs text-briefly-muted">Synthesizing patterns across your history…</p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-8 rounded-card border border-briefly-border bg-briefly-redBg p-4 text-sm text-briefly-red">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="mt-8 space-y-10">
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Where you are strong</p>
            <div className="mt-3 space-y-3">
              {(data.strengths || []).slice(0, 3).map((s, idx) => (
                <div
                  key={`st-${idx}`}
                  className="rounded-card border border-briefly-border bg-briefly-surface p-4 text-sm leading-relaxed text-briefly-text shadow-brieflyCard"
                  style={{ borderLeftWidth: 3, borderLeftColor: '#008060' }}
                >
                  {s}
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">What keeps coming back</p>
            <div className="mt-3 space-y-3">
              {(data.frictions || []).map((f, idx) => (
                <div
                  key={`fr-${idx}`}
                  className="rounded-card border border-briefly-border bg-briefly-surface p-4 shadow-brieflyCard"
                  style={{ borderLeftWidth: 3, borderLeftColor: '#b98900' }}
                >
                  <p className="text-sm leading-relaxed text-briefly-text">{f.observation}</p>
                  <p className="mt-2 inline-flex rounded-full bg-briefly-amberBg px-2 py-0.5 text-[11px] font-semibold text-briefly-amber">
                    Mentioned in {f.sessionCount} of {memory.length} sessions
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      startLongitudinalVoiceSession({
                        mode: 'friction',
                        prompt: `Let's work this friction: ${f.observation}. Say what is true right now — what you tried, what you avoided, and what you want next.`,
                      })
                    }
                    className="mt-3 text-xs font-semibold text-briefly-green underline-offset-4 hover:underline"
                  >
                    Work through this →
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">How you make decisions</p>
            {outcomeCount < 3 ? (
              <div className="mt-3 rounded-card border border-briefly-border bg-briefly-page p-4 text-sm text-briefly-muted">
                Once MyHustle has at least three follow-up outcomes on your actions, this section becomes a read on how you actually follow through — not what you intend, but what happens.
              </div>
            ) : (
              <div className="mt-3 rounded-card border border-briefly-border bg-briefly-surface p-4 shadow-brieflyCard">
                <p className="text-sm leading-relaxed text-briefly-text">
                  {data.decisionStyle || 'You are building a clearer decision trail — keep marking outcomes when MyHustle checks in.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-briefly-greenBg px-3 py-1 text-[11px] font-semibold text-briefly-green">
                    {data.completedActions} actions completed
                  </span>
                  <span className="rounded-full bg-briefly-page px-3 py-1 text-[11px] font-semibold text-briefly-muted">
                    {data.deferredActions} actions deferred
                  </span>
                </div>
              </div>
            )}
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Your momentum</p>
            <div className="mt-3 h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={momentumRows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#008060" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#008060" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6d7175' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['dataMin - 8', 'dataMax + 8']} />
                  <Tooltip
                    cursor={{ stroke: '#e1e3e5' }}
                    contentStyle={{ borderRadius: 8, borderColor: '#e1e3e5', fontSize: 12 }}
                  />
                  <ReferenceLine
                    y={momentumStats.max}
                    stroke="#008060"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                  />
                  <ReferenceLine y={momentumStats.mean} stroke="#8c9196" strokeWidth={1} ifOverflow="extendDomain" />
                  <ReferenceLine
                    y={momentumStats.min}
                    stroke="#c9cccf"
                    strokeDasharray="2 4"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                  />
                  <Area type="monotone" dataKey="score" stroke="none" fill="url(#momentumFill)" />
                  <Line type="monotone" dataKey="score" stroke="#008060" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              {trendLabel()}
              <div className="flex flex-wrap gap-3 text-[10px] text-briefly-muted">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-t border-dashed border-briefly-green" /> Personal best
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 bg-briefly-muted" /> Long-run average
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-0.5 w-4 border-t border-dotted border-briefly-borderStrong" /> Low watermark
                </span>
              </div>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Your logging habits</p>
            <div className="mt-3 overflow-x-auto rounded-card border border-briefly-border bg-briefly-surface p-3 shadow-brieflyCard">
              <div className="min-w-[260px] space-y-2">
                <div className="grid grid-cols-[52px_repeat(7,12px)] items-center gap-x-2">
                  <div />
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={`d-${i}`} className="text-center text-[10px] font-semibold text-briefly-muted">
                      {d}
                    </div>
                  ))}
                </div>
                {habitWeeks.map((w) => (
                  <div key={w.rowKey} className="grid grid-cols-[52px_repeat(7,12px)] items-center gap-x-2">
                    <div className="pr-1 text-right text-[10px] font-semibold text-briefly-muted">{w.weekLabel}</div>
                    {w.cells.map((score, idx) => (
                      <div key={`${w.rowKey}-${idx}`} className="flex justify-center">
                        <span
                          className="block h-3 w-3 rounded-full"
                          style={{ background: cellColor(score) }}
                          title={score == null ? 'No session' : `Day score ${score}`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
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
