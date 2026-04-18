import { useApp } from '../../context/AppContext';

export function GrowthReflectionCard() {
  const { growthReflection, startLongitudinalVoiceSession } = useApp();
  if (!growthReflection?.thenQuote || !growthReflection?.nowObservation) return null;

  const q = growthReflection.reflectionPrompt;

  return (
    <div
      className="rounded-card border border-briefly-border p-4 shadow-brieflyCard"
      style={{ background: '#f0f7ff', borderLeftWidth: 3, borderLeftColor: '#0070f3' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-blue">
        LOOK HOW FAR YOU&apos;VE COME
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-briefly-muted">5 SESSIONS AGO</p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-briefly-text">
            <span className="text-briefly-muted">&ldquo;</span>
            {growthReflection.thenQuote}
            <span className="text-briefly-muted">&rdquo;</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-briefly-muted">NOW</p>
          <p className="mt-1 text-sm leading-relaxed text-briefly-text">{growthReflection.nowObservation}</p>
        </div>
      </div>

      {q && (
        <button
          type="button"
          onClick={() => startLongitudinalVoiceSession({ mode: 'growth', prompt: q })}
          className="mt-4 w-full rounded-card border border-briefly-border bg-briefly-surface px-3 py-3 text-left text-sm font-medium text-briefly-text shadow-brieflyCard transition-colors hover:bg-briefly-page"
        >
          <span className="text-briefly-blue">{q}</span>
          <span className="mt-1 block text-xs font-semibold text-briefly-green">Tap to reflect →</span>
        </button>
      )}

      {growthReflection.reflectionNote && (
        <p className="mt-3 rounded-card border border-briefly-border bg-briefly-surface p-3 text-xs leading-relaxed text-briefly-muted">
          <span className="font-semibold text-briefly-text">Your note: </span>
          {growthReflection.reflectionNote}
        </p>
      )}
    </div>
  );
}
