import { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';

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

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 12.5 10 16.5 18 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OutcomeCheckIn({ sessionsAgo, actionTitle, onResolved, onError }) {
  const [busy, setBusy] = useState(false);

  const submit = async (text) => {
    const t = String(text || '').trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const data = await postJson('/api/outcome', {
        actionTitle,
        userResponse: t,
      });
      onResolved?.({
        outcome: data.outcome,
        outcomeLabel: data.outcomeLabel,
      });
    } catch (e) {
      onError?.(e.message || 'Could not save outcome.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 pb-16 pt-6">
      <div
        className="rounded-card border border-briefly-border p-5 shadow-brieflyCard"
        style={{ background: '#f1f8f5' }}
      >
        <div className="flex justify-center text-briefly-green">
          <CheckIcon className="h-8 w-8" />
        </div>
        <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-briefly-green">
          Following up
        </p>
        <p className="mt-3 text-center text-sm leading-relaxed text-briefly-text">
          <span className="font-semibold text-briefly-muted">
            {sessionsAgo === 0 ? 'Recently' : `${sessionsAgo} sessions ago`}
          </span>{' '}
          you committed to:{' '}
          <span className="font-semibold text-briefly-text">{actionTitle}</span>. How did it go?
        </p>
        <VoiceRecorder
          disabled={busy}
          instruction={busy ? 'Saving…' : 'One answer — tap to speak, tap again to stop.'}
          onCommit={submit}
        />
      </div>
    </div>
  );
}
