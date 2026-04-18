import { useApp } from '../../context/AppContext';

export function ForwardBriefCard() {
  const { forwardBrief, startLongitudinalVoiceSession } = useApp();
  if (!forwardBrief?.observation) return null;

  const focus = forwardBrief.focusQuestion || forwardBrief.preparationAction;

  return (
    <div
      className="rounded-card border border-briefly-border bg-briefly-surface p-4 shadow-brieflyCard"
      style={{ borderLeftWidth: 3, borderLeftColor: '#008060' }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-green">WHAT IS COMING</p>
      <p className="mt-3 text-sm leading-relaxed text-briefly-text">{forwardBrief.observation}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-briefly-muted">Prepare now</p>
      <p className="mt-1 text-sm font-medium text-briefly-text">{forwardBrief.preparationAction}</p>
      <button
        type="button"
        onClick={() =>
          startLongitudinalVoiceSession({
            mode: 'forward',
            prompt: focus,
          })
        }
        className="mt-4 w-full rounded-card bg-briefly-green py-2.5 text-sm font-semibold text-white shadow-brieflyCard transition-transform active:scale-[0.99]"
      >
        Think through this now →
      </button>
      {forwardBrief.followThroughNote && (
        <p className="mt-3 text-xs leading-relaxed text-briefly-muted">
          <span className="font-semibold text-briefly-text">Captured: </span>
          {forwardBrief.followThroughNote}
        </p>
      )}
    </div>
  );
}
