import { useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { SuggestionsPanel } from '../home/SuggestionsPanel';
import { GrowthReflectionCard } from '../home/GrowthReflectionCard';
import { ForwardBriefCard } from '../home/ForwardBriefCard';
import { memoryChronological } from '../../lib/longitudinalUtils';

function HistoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 5h16v14H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChecklistIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 5.5H6.5A1.5 1.5 0 005 7v12A1.5 1.5 0 006.5 20.5h11A1.5 1.5 0 0019 19V7a1.5 1.5 0 00-1.5-1.5H15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 5.5a2.5 2.5 0 015 0V7H9V5.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 10.5h6M8.5 14.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PatternsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2c1.4 3.2 4.5 4.5 4.5 8.5 0 3.5-2 6.5-4.5 6.5S7.5 14 7.5 10.5C7.5 7.5 9.5 5 12 2z" />
    </svg>
  );
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

function isReminderInNextTwoHours(reminder) {
  if (reminder.status !== 'pending') return false;
  const t = new Date(reminder.reminderTime).getTime();
  const now = Date.now();
  if (Number.isNaN(t)) return false;
  return t >= now && t <= now + 2 * 60 * 60 * 1000;
}

function formatReminderTimeShort(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function HomeScreen() {
  const {
    navigate,
    startSession,
    memory,
    todayKey,
    yesterdayMemory,
    latestMemory,
    streak,
    markYesterdayActionDone,
    markYesterdayActionSkipped,
    hydrated,
    user,
    activeHustle,
    hustles,
    reminders,
    dispatch,
    growthReflectionReady,
    growthReflection,
    forwardBriefReady,
    forwardBrief,
    lastForwardBriefAt,
    applyForwardBriefFromApi,
  } = useApp();

  const hustleLabel = activeHustle?.name?.trim() || 'this hustle';
  const openHeadline =
    activeHustle?.openingPromptVariant === 'week'
      ? `How has ${hustleLabel} been this week?`
      : `How did ${hustleLabel} go today?`;

  const hasMemory = memory.length > 0;
  const todaySessions = useMemo(
    () => memory.filter((m) => m.date === todayKey),
    [memory, todayKey]
  );
  const todayEntry = todaySessions[0] || null;
  const todayCount = todaySessions.length;

  const showGrowth = Boolean(growthReflectionReady && growthReflection?.thenQuote);
  const showForward = Boolean(forwardBriefReady && forwardBrief?.observation);

  const showContinuity =
    !showGrowth &&
    hasMemory &&
    yesterdayMemory &&
    (yesterdayMemory.actionStatus === 'pending' || yesterdayMemory.actionStatus === 'done');
  const followUp = latestMemory?.followUpQuestion;

  const showTodoIconBadge = useMemo(
    () => reminders.some((r) => isReminderInNextTwoHours(r)),
    [reminders]
  );

  const homeReminder = useMemo(() => {
    const list = reminders
      .filter((r) => isReminderInNextTwoHours(r))
      .map((r) => ({ r, t: new Date(r.reminderTime).getTime() }))
      .sort((a, b) => a.t - b.t);
    return list[0]?.r ?? null;
  }, [reminders]);

  const homeReminderHustleName = useMemo(() => {
    if (!homeReminder) return '';
    const h = hustles.find((x) => x.id === homeReminder.hustleId);
    return h?.name?.trim() || 'Your hustle';
  }, [hustles, homeReminder]);

  useEffect(() => {
    if (!hydrated) return;
    if (memory.length === 0) return;
    if (memory.length % 7 === 0) return;
    const sevenDaysMs = 7 * 86400000;
    const timeStale =
      lastForwardBriefAt && Date.now() - new Date(lastForwardBriefAt).getTime() >= sevenDaysMs;
    const countBackfill = !lastForwardBriefAt && memory.length > 7;
    if (!timeStale && !countBackfill) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await postJson('/api/forward-brief', {
          user,
          memory: memoryChronological(memory),
        });
        if (!cancelled) applyForwardBriefFromApi(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, memory, user, lastForwardBriefAt, applyForwardBriefFromApi]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-left text-base font-semibold text-briefly-text"
          onClick={() => navigate('portfolio')}
        >
          MyHustle
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="relative rounded-full p-2 text-briefly-text hover:bg-briefly-surface"
            aria-label="Tasks"
            onClick={() => navigate('todo')}
          >
            <ChecklistIcon className="h-6 w-6" />
            {showTodoIconBadge && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-briefly-amber" aria-hidden />
            )}
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-briefly-text hover:bg-briefly-surface"
            aria-label="Patterns"
            onClick={() => navigate('patterns')}
          >
            <PatternsIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-briefly-text hover:bg-briefly-surface"
            aria-label="Open history"
            onClick={() => navigate('history')}
          >
            <HistoryIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {homeReminder && (
        <div
          className="mt-4 flex items-start justify-between gap-3 rounded-card border p-3"
          style={{ borderColor: '#e1e3e5', backgroundColor: '#fff5ea' }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-briefly-text">
              <span aria-hidden>🔔</span>{' '}
              <span className="font-medium">&ldquo;{homeReminder.actionTitle}&rdquo;</span>
              <span className="text-briefly-muted"> — {homeReminderHustleName}</span>
            </p>
            <p className="mt-1 text-xs text-briefly-muted">Reminder set for {formatReminderTimeShort(homeReminder.reminderTime)}</p>
          </div>
          <button
            type="button"
            className="shrink-0 text-xs font-semibold text-briefly-muted hover:text-briefly-text"
            onClick={() => dispatch({ type: 'DISMISS_REMINDER', id: homeReminder.id })}
          >
            Dismiss
          </button>
        </div>
      )}

      {activeHustle && (
        <div className="mt-3 flex items-center gap-2 text-sm text-briefly-muted">
          <span className="text-lg" aria-hidden>
            {activeHustle.emoji}
          </span>
          <span className="font-medium text-briefly-text">{activeHustle.name}</span>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {showForward && <ForwardBriefCard />}

        {showGrowth && <GrowthReflectionCard />}

        {showContinuity && yesterdayMemory?.actionStatus === 'pending' && (
          <Card className="border-l-[3px] border-l-briefly-green p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">From yesterday</p>
            <p className="mt-2 text-base font-semibold text-briefly-text">{yesterdayMemory.action.title}</p>
            <p className="mt-3 text-sm text-briefly-muted">Did you get to this?</p>
            <div className="mt-3 flex gap-2">
              <PrimaryButton className="flex-1 py-2 text-sm" onClick={markYesterdayActionDone}>
                ✓ Yes, I did
              </PrimaryButton>
              <SecondaryButton className="flex-1 py-2 text-sm" onClick={markYesterdayActionSkipped}>
                Not yet
              </SecondaryButton>
            </div>
          </Card>
        )}

        {showContinuity && yesterdayMemory?.actionStatus === 'done' && (
          <Card className="border-l-[3px] border-l-briefly-green p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Yesterday&apos;s win</p>
            <p className="mt-2 text-base font-semibold text-briefly-text">
              You completed: {yesterdayMemory.action.title}
            </p>
            <p className="mt-2 text-sm text-briefly-muted">{yesterdayMemory.headline}</p>
          </Card>
        )}

        {followUp && (
          <div className="rounded-card border border-briefly-border bg-briefly-amberBg p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-amber">
              Picking up where we left off
            </p>
            <p className="mt-2 text-sm font-medium text-briefly-text">{followUp}</p>
            <PrimaryButton className="mt-4 w-full py-2 text-sm" onClick={() => startSession({ seedPrompt: followUp })}>
              Tell me how it went →
            </PrimaryButton>
          </div>
        )}

        <SuggestionsPanel />

        {!todayEntry && (
          <div className="mt-10 flex flex-col items-center text-center">
            <p className="text-[22px] font-semibold text-briefly-text">{openHeadline}</p>
            <p className="mt-2 text-sm text-briefly-muted">Tap to start. Takes about three minutes.</p>
            <button
              type="button"
              aria-label="Start session"
              onClick={() => startSession()}
              className="mt-8 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-briefly-green text-sm font-semibold text-white shadow-brieflyCard transition-transform active:scale-[0.98]"
            >
              Rec
            </button>
          </div>
        )}

        {todayEntry && (
          <div className="mt-8 space-y-4">
            {todayCount > 1 && (
              <p className="text-center text-xs font-medium text-briefly-muted">
                Today · {todayCount} check-ins
              </p>
            )}
            <Card className="border-l-[3px] border-l-briefly-green p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">
                Latest check-in
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-briefly-text">{todayEntry.theOneThing}</p>
              <p className="mt-3 text-xs font-semibold text-briefly-muted">Do this next</p>
              <p className="mt-1 text-sm font-semibold text-briefly-text">{todayEntry.action.title}</p>
            </Card>
            <SecondaryButton className="w-full" onClick={() => startSession({ freeform: true })}>
              Add another check-in →
            </SecondaryButton>
          </div>
        )}
      </div>

      {streak > 0 && (
        <div className="mt-auto flex items-center justify-center gap-2 pt-10 text-xs text-briefly-muted">
          {streak >= 3 && <FlameIcon className="h-4 w-4 text-briefly-amber" />}
          <span>{streak} day streak</span>
        </div>
      )}
    </div>
  );
}
