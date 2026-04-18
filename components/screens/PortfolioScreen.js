import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';

function formatRelativeTime(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const d = Math.floor(diff / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

export function PortfolioScreen() {
  const {
    hustles,
    navigate,
    setActiveHustle,
    activeHustleId,
    crossHustleObservation,
    crossHustleObservationDate,
    setCrossHustleObservation,
  } = useApp();

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (hustles.length < 2 || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const payload = {
          hustles: hustles.map((h) => ({
            id: h.id,
            name: h.name,
            emoji: h.emoji,
            lastHeadline: h.memory[0]?.headline || null,
            sessionCount: h.memory.length,
          })),
        };
        const data = await postJson('/api/cross-hustle-observation', payload);
        if (!cancelled && data?.observation) {
          setCrossHustleObservation(data.observation, new Date().toISOString());
        }
      } catch {
        /* optional feature */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hustles, setCrossHustleObservation]);

  const obsFresh =
    crossHustleObservation &&
    crossHustleObservationDate &&
    Date.now() - new Date(crossHustleObservationDate).getTime() < 86400000;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <p className="text-[18px] font-bold" style={{ color: '#202223' }}>
          MyHustle
        </p>
        <span />
      </header>

      {obsFresh && (
        <div className="mt-8 rounded-card border border-briefly-border bg-briefly-surface p-4 shadow-brieflyCard">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Across your hustles</p>
          <p className="mt-2 text-sm leading-relaxed text-briefly-text">{crossHustleObservation}</p>
        </div>
      )}

      <p className="mt-10 text-xs font-semibold uppercase tracking-wide text-briefly-muted">Your hustles</p>
      <ul className="mt-3 space-y-2">
        {hustles.map((h) => {
          const active = h.id === activeHustleId;
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => setActiveHustle(h.id)}
                className={`flex w-full items-center gap-3 rounded-card border p-4 text-left transition-colors ${
                  active
                    ? 'border-briefly-green bg-briefly-greenBg'
                    : 'border-briefly-border bg-briefly-surface hover:bg-briefly-page'
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {h.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-briefly-text">{h.name}</p>
                  <p className="mt-0.5 text-xs text-briefly-muted">
                    {h.streak > 0 ? `${h.streak} day streak` : 'No streak yet'}
                    {h.lastSessionAt ? ` · ${formatRelativeTime(h.lastSessionAt)}` : ''}
                  </p>
                </div>
                <span className="text-briefly-muted">→</span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="mt-10 w-full rounded-card border border-dashed border-briefly-border bg-briefly-page py-4 text-sm font-semibold text-briefly-text transition-colors hover:border-briefly-green hover:bg-briefly-greenBg"
        onClick={() => navigate('new-hustle')}
      >
        + Add another hustle
      </button>
    </div>
  );
}
