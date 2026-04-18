import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { Card } from '../ui/Card';
import { ActionCard } from '../insight/ActionCard';
import { InsightCard } from '../insight/InsightCard';
import { ReminderCard } from '../insight/ReminderCard';
import { dayQualityLabel } from '../../lib/dates';
import { computeReminderFromDeadline, useReminder } from '../../hooks/useReminder';
import { newMemoryId } from '../../lib/memoryIds';

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

function MoodDots({ moodScore }) {
  const n = Math.max(1, Math.min(5, Math.round(Number(moodScore) || 3)));
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              i <= n ? 'bg-briefly-amber' : 'bg-briefly-borderStrong'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-briefly-muted">Mood</span>
    </div>
  );
}

function directionDot(direction) {
  if (direction === 'up') return { label: '▲', className: 'text-briefly-green' };
  if (direction === 'down') return { label: '▼', className: 'text-briefly-red' };
  if (direction === 'flag') return { label: '!', className: 'text-briefly-red' };
  return { label: '●', className: 'text-briefly-muted' };
}

function firstInsightSentence(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  const m = s.match(/[^.!?]+[.!?]?/);
  return (m ? m[0] : s).trim();
}

export function InsightScreen() {
  const { currentSession, commitTodayMemory, memory, goHome, user, updateSession, activeHustle, dispatch } = useApp();
  const base = currentSession.processedInsight;

  const priorCountBeforeSave = useMemo(() => memory.length, [memory.length]);

  const [expanded, setExpanded] = useState(false);
  const [altMode, setAltMode] = useState(false);
  const [obstruction, setObstruction] = useState('');
  const [altBusy, setAltBusy] = useState(false);
  const [altError, setAltError] = useState('');

  const [display, setDisplay] = useState(null);
  const insight = display || base;

  const extras = useMemo(() => {
    const list = Array.isArray(insight?.extraActions) ? insight.extraActions : [];
    return list.filter((a) => a?.title && a?.how);
  }, [insight]);

  const { reminderTime, reminderLabel, reminderSet } = useReminder(insight?.action?.deadlineLabel);
  const [primaryReminderId] = useState(() => newMemoryId());
  const extraIdsRef = useRef({});

  useEffect(() => {
    if (!insight?.action || !reminderSet || !reminderTime || !activeHustle?.id) return;
    dispatch({
      type: 'SET_REMINDER',
      reminder: {
        id: primaryReminderId,
        hustleId: activeHustle.id,
        actionTitle: insight.action.title,
        reminderTime: reminderTime.toISOString(),
        actionId: 'primary',
        status: 'pending',
      },
    });
  }, [
    activeHustle?.id,
    dispatch,
    insight?.action,
    primaryReminderId,
    reminderSet,
    reminderTime,
  ]);

  useEffect(() => {
    if (!activeHustle?.id) return;
    extras.forEach((a, idx) => {
      const { reminderTime: rt } = computeReminderFromDeadline(a.deadlineLabel);
      if (!rt) return;
      const k = `extra-${idx}-${a.title}`;
      if (!extraIdsRef.current[k]) {
        extraIdsRef.current[k] = newMemoryId();
      }
      const id = extraIdsRef.current[k];
      dispatch({
        type: 'SET_REMINDER',
        reminder: {
          id,
          hustleId: activeHustle.id,
          actionTitle: a.title,
          reminderTime: rt.toISOString(),
          actionId: `extra-${idx}`,
          status: 'pending',
        },
      });
    });
  }, [activeHustle?.id, dispatch, extras]);

  if (!base) {
    return (
      <div className="mx-auto max-w-lg px-5 py-10">
        <p className="text-sm text-briefly-muted">No insight found for this session.</p>
        <SecondaryButton className="mt-4" onClick={() => goHome()}>
          Home
        </SecondaryButton>
      </div>
    );
  }

  const patternNote =
    insight.patternNote && priorCountBeforeSave >= 3 ? insight.patternNote : null;

  const signals = Array.isArray(insight.signals) ? insight.signals.slice(0, 5) : [];

  const onIllDo = () => {
    commitTodayMemory({
      processed: insight,
      actionStatus: 'pending',
      primaryCompleted: false,
      todoFromInsight: {
        reminderId: reminderSet ? primaryReminderId : null,
        sourceInsight: firstInsightSentence(insight.insight),
      },
    });
  };

  const onMarkComplete = () => {
    commitTodayMemory({ processed: insight, actionStatus: 'done', primaryCompleted: true });
  };

  const submitAlternate = async () => {
    const text = obstruction.trim();
    if (!text) return;
    setAltBusy(true);
    setAltError('');
    try {
      const data = await postJson('/api/alternateAction', {
        user,
        obstruction: text,
      });
      const merged = {
        ...insight,
        extraActions: [],
        insight: `${insight.insight}${data.insightTweak ? `\n\n${data.insightTweak}` : ''}`,
        action: data.action,
      };
      setDisplay(merged);
      updateSession({ processedInsight: merged });
      setAltMode(false);
      setObstruction('');
    } catch (e) {
      setAltError(e.message || 'Could not generate an alternate action.');
    } finally {
      setAltBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
      <InsightCard insightText={insight.insight} />

      <div className="mt-8">
        <ActionCard
          insight={insight}
          disabled={altBusy}
          onIllDo={onIllDo}
          onMarkComplete={onMarkComplete}
          reminderLabel={reminderLabel}
          showReminderCard={reminderSet && Boolean(reminderLabel)}
        />
      </div>

      {extras.length > 0 && (
        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">More moves</p>
          <p className="mt-1 text-xs text-briefly-muted">Optional extras when you have bandwidth.</p>
          <div className="mt-4 space-y-3">
            {extras.map((a, idx) => {
              const { reminderTime: extraT, reminderLabel: extraL } = computeReminderFromDeadline(a.deadlineLabel);
              return (
                <Card key={`extra-${idx}-${a.title}`} className="border-l-[3px] border-l-briefly-borderStrong p-4">
                  <p className="text-sm font-semibold text-briefly-text">{a.title}</p>
                  <p className="mt-1 text-xs text-briefly-muted">{a.how}</p>
                  <p className="mt-2 inline-flex rounded-full bg-briefly-page px-2 py-0.5 text-[11px] font-semibold text-briefly-muted">
                    {a.deadlineLabel}
                  </p>
                  {extraT && extraL ? (
                    <div className="mt-3">
                      <ReminderCard actionTitle={a.title} reminderLabel={extraL} />
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!altMode && (
        <div className="mt-6">
          <SecondaryButton className="w-full py-2 text-sm" onClick={() => setAltMode(true)}>
            Not for me
          </SecondaryButton>
        </div>
      )}

      {altMode && (
        <div className="mt-6 rounded-card border border-briefly-border bg-briefly-surface p-4">
          <p className="text-sm font-semibold text-briefly-text">What is getting in the way?</p>
          <textarea
            value={obstruction}
            onChange={(e) => setObstruction(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-card border border-briefly-border bg-briefly-surface p-3 text-sm text-briefly-text"
            placeholder="Be honest — even one line helps."
          />
          {altError && <p className="mt-2 text-xs text-briefly-red">{altError}</p>}
          <div className="mt-3 flex gap-2">
            <PrimaryButton className="flex-1 py-2 text-sm" disabled={altBusy || !obstruction.trim()} onClick={submitAlternate}>
              Generate alternative
            </PrimaryButton>
            <SecondaryButton className="py-2 text-sm" disabled={altBusy} onClick={() => setAltMode(false)}>
              Cancel
            </SecondaryButton>
          </div>
        </div>
      )}

      <button
        type="button"
        className="mt-8 text-sm font-semibold text-briefly-green underline-offset-4 hover:underline"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? 'Hide the full picture ↑' : 'See the full picture ↓'}
      </button>

      {expanded && (
        <div className="mt-5 space-y-5">
          {signals.length > 1 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Signals</p>
              <div className="mt-3 space-y-2">
                {signals.map((s, idx) => {
                  const dot = directionDot(s.direction);
                  return (
                    <div key={`${idx}-${s.sentence}`} className="flex gap-3 rounded-card border border-briefly-border bg-briefly-surface p-3">
                      <span className={`mt-0.5 text-xs font-bold ${dot.className}`}>{dot.label}</span>
                      <div className="flex-1">
                        <p className="text-sm text-briefly-text">{s.sentence}</p>
                        <span className="mt-2 inline-flex rounded-full bg-briefly-page px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">
                          {s.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {patternNote && (
            <div className="rounded-card border border-briefly-border bg-briefly-amberBg p-4">
              <p className="text-sm font-medium text-briefly-text">{patternNote}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-card border border-briefly-border bg-briefly-surface p-4">
            <MoodDots moodScore={insight.moodScore} />
            <p className="text-sm text-briefly-text">
              Day quality: <span className="font-semibold">{dayQualityLabel(insight.dayScore)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
