import { useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { SecondaryButton } from '../ui/SecondaryButton';
import { downloadPlaybookPdf } from '../../lib/downloadPlaybookPdf';

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

function effortLabel(effort) {
  if (effort === 'small') return 'Small effort';
  if (effort === 'large') return 'Larger lift';
  return 'Medium effort';
}

export function SuggestionsPanel() {
  const { user, memory } = useApp();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [pdfLoadingIdx, setPdfLoadingIdx] = useState(null);
  const [pdfError, setPdfError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    setPdfError('');
    if (!memory.length) {
      setItems([]);
      setLoaded(true);
      return;
    }
    setBusy(true);
    try {
      const tail = memory.slice(0, 12).map((m) => ({
        id: m.id,
        date: m.date,
        headline: m.headline,
        theOneThing: m.theOneThing,
        action: m.action,
        actionStatus: m.actionStatus,
        dayScore: m.dayScore,
        moodScore: m.moodScore,
        signals: m.signals,
      }));
      const data = await postJson('/api/suggestions', { user, memory: tail });
      setItems(data.items || []);
      setLoaded(true);
    } catch (e) {
      setError(e.message || 'Could not load suggestions.');
    } finally {
      setBusy(false);
    }
  }, [user, memory]);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-briefly-text">Suggestions for you</p>
          <p className="mt-1 text-xs text-briefly-muted">Based on what MyHustle already knows about this hustle.</p>
        </div>
        <SecondaryButton className="shrink-0 py-2 text-xs" disabled={busy} onClick={refresh}>
          {busy ? 'Refreshing…' : 'Refresh suggestions'}
        </SecondaryButton>
      </div>

      {!memory.length && (
        <p className="mt-4 text-sm text-briefly-muted">
          Complete your first check-in — then MyHustle can suggest next moves from your own patterns.
        </p>
      )}

      {memory.length > 0 && !loaded && !busy && !error && (
        <p className="mt-4 text-sm text-briefly-muted">Tap refresh to generate ideas grounded in your memory.</p>
      )}

      {error && <p className="mt-3 text-xs text-briefly-red">{error}</p>}
      {pdfError && <p className="mt-2 text-xs text-briefly-red">{pdfError}</p>}

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((it, idx) => (
            <li key={`${idx}-${it.title}`} className="rounded-card border border-briefly-border bg-briefly-page p-3">
              <p className="text-sm font-semibold text-briefly-text">{it.title}</p>
              <p className="mt-1 text-xs text-briefly-muted">{it.why}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-briefly-amber">
                {effortLabel(it.effort)}
              </p>
              <SecondaryButton
                className="mt-3 w-full py-2 text-xs"
                disabled={pdfLoadingIdx !== null || busy}
                onClick={async () => {
                  setPdfLoadingIdx(idx);
                  setPdfError('');
                  try {
                    await downloadPlaybookPdf({
                      user,
                      memory,
                      topic: it.title,
                      context: [
                        'This PDF is for a home-screen suggestion (not a live session).',
                        '',
                        `Suggestion: ${it.title}`,
                        `Why: ${it.why}`,
                        `Effort: ${effortLabel(it.effort)}`,
                      ].join('\n'),
                    });
                  } catch (e) {
                    setPdfError(e.message || 'Could not generate PDF.');
                  } finally {
                    setPdfLoadingIdx(null);
                  }
                }}
              >
                {pdfLoadingIdx === idx ? 'Generating PDF…' : 'Generate PDF'}
              </SecondaryButton>
            </li>
          ))}
        </ul>
      )}

      {loaded && !busy && !error && memory.length > 0 && items.length === 0 && (
        <p className="mt-4 text-sm text-briefly-muted">No suggestions yet — try again after another session.</p>
      )}
    </Card>
  );
}
