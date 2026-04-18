import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VoiceRecorder } from '../session/VoiceRecorder';
import { ThinkingAnimation } from '../session/ThinkingAnimation';
import { Card } from '../ui/Card';
import { SecondaryButton } from '../ui/SecondaryButton';
import { OutcomeCheckIn } from '../session/OutcomeCheckIn';

function findStaleUserTodo(todos, hustleId) {
  if (!hustleId || !Array.isArray(todos)) return null;
  const now = Date.now();
  const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
  const candidates = todos.filter((t) => {
    if (t.hustleId !== hustleId) return false;
    if (t.status !== 'pending') return false;
    if (t.source !== 'user') return false;
    if (!t.createdAt) return false;
    return now - new Date(t.createdAt).getTime() > tenDaysMs;
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const oldest = candidates[0];
  const daysOld = Math.max(
    1,
    Math.floor((now - new Date(oldest.createdAt).getTime()) / (24 * 60 * 60 * 1000))
  );
  return { title: oldest.title, daysOld };
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

export function SessionScreen() {
  const {
    user,
    activeHustle,
    todos,
    memory,
    sessionSeedPrompt,
    sessionFreeform,
    longitudinalSession,
    clearSessionSeed,
    navigate,
    pushConversation,
    setProcessedInsight,
    updateSession,
    goHome,
    resolveActionOutcome,
    saveGrowthReflectionNote,
    saveForwardBriefNote,
    saveFrictionWorkNote,
    patternContextForProcess,
    outcomeContextForProcess,
  } = useApp();

  const hustleLabel = activeHustle?.name?.trim() || 'this hustle';
  const sessionOpeningEmpty =
    activeHustle?.openingPromptVariant === 'week'
      ? `How has ${hustleLabel} been this week?`
      : `How did ${hustleLabel} go today?`;

  const memoryFingerprint = useMemo(
    () => memory.map((m) => `${m.id}:${m.action?.outcome || ''}:${m.action?.followUpDue ?? ''}`).join('|'),
    [memory]
  );

  const dueEntry = useMemo(() => {
    return (
      memory.find(
        (m) =>
          m.action &&
          m.action.followUpDue != null &&
          m.action.followUpDue === memory.length &&
          m.action.outcome == null
      ) || null
    );
  }, [memory]);

  const sessionsAgoForDue = useMemo(() => {
    if (!dueEntry) return 0;
    const idx = memory.findIndex((m) => m.id === dueEntry.id);
    return idx === -1 ? 0 : idx;
  }, [dueEntry, memory]);

  const [openingQuestion, setOpeningQuestion] = useState('');
  const [openingLoading, setOpeningLoading] = useState(
    () => !sessionFreeform && !longitudinalSession && memory.length > 0 && !sessionSeedPrompt && !dueEntry
  );
  const [openingError, setOpeningError] = useState('');
  const [outcomeError, setOutcomeError] = useState('');

  const [phase, setPhase] = useState('prompt');
  const [firstTranscript, setFirstTranscript] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followupError, setFollowupError] = useState('');
  const [processError, setProcessError] = useState('');

  const [showStopHint, setShowStopHint] = useState(false);

  const showOutcome = Boolean(dueEntry);
  const showLongitudinal = Boolean(longitudinalSession) && !showOutcome;

  const [openingCycle, setOpeningCycle] = useState(0);
  const prevHadDueRef = useRef(Boolean(dueEntry));

  useEffect(() => {
    const hadDue = Boolean(dueEntry);
    if (prevHadDueRef.current && !hadDue) {
      setOpeningCycle((c) => c + 1);
    }
    prevHadDueRef.current = hadDue;
  }, [dueEntry]);

  useEffect(() => {
    if (showOutcome || showLongitudinal) return undefined;
    let cancelled = false;
    (async () => {
      setOpeningError('');
      if (sessionFreeform) {
        setOpeningQuestion('What do you want to add?');
        setOpeningLoading(false);
        return;
      }
      if (sessionSeedPrompt) {
        setOpeningQuestion(sessionSeedPrompt);
        clearSessionSeed();
        setOpeningLoading(false);
        return;
      }
      if (memory.length === 0) {
        setOpeningQuestion(sessionOpeningEmpty);
        setOpeningLoading(false);
        return;
      }
      setOpeningLoading(true);
      try {
        const staleTask = findStaleUserTodo(todos, activeHustle?.id);
        updateSession({ staleTask });
        const data = await postJson('/api/opening', {
          user,
          memoryTail: memory.slice(0, 5),
          staleTask,
        });
        if (!cancelled) setOpeningQuestion(data.openingQuestion);
      } catch (e) {
        if (!cancelled) {
          setOpeningError(e.message || 'Could not personalize your opening.');
          setOpeningQuestion(sessionOpeningEmpty);
        }
      } finally {
        if (!cancelled) setOpeningLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // `memory` is intentionally tracked via memoryFingerprint + memory.length to avoid re-fetching the opening mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    openingCycle,
    showOutcome,
    showLongitudinal,
    sessionFreeform,
    sessionSeedPrompt,
    memory.length,
    memoryFingerprint,
    todos,
    activeHustle?.id,
    user,
    sessionOpeningEmpty,
    clearSessionSeed,
    updateSession,
  ]);

  useEffect(() => {
    if (phase !== 'listening' && phase !== 'listeningFollowup') return undefined;
    const t = setTimeout(() => setShowStopHint(true), 3000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    setShowStopHint(false);
  }, [phase]);

  const runProcess = async (transcripts, conversationHistory, singleTurn) => {
    setPhase('processing');
    setProcessError('');
    updateSession({ status: 'thinking' });
    try {
      const priorCount = memory.length;
      const priorSessions = memory.slice(0, 8).map((m) => ({
        date: m.date,
        headline: m.headline,
        theOneThing: m.theOneThing,
        dayScore: m.dayScore,
        moodScore: m.moodScore,
        signals: m.signals,
      }));
      const body = {
        user,
        transcripts,
        conversationHistory,
        singleTurn,
        priorSessions: singleTurn || priorCount < 3 ? [] : priorSessions,
      };
      if (priorCount >= 5 && patternContextForProcess) {
        body.patternContext = patternContextForProcess;
      }
      if (outcomeContextForProcess) {
        body.outcomeContext = outcomeContextForProcess;
      }
      const data = await postJson('/api/process', body);
      setProcessedInsight(data);
      navigate('insight');
    } catch (e) {
      setProcessError(e.message || 'Processing failed');
      setPhase(singleTurn ? 'prompt' : 'followup');
      updateSession({ status: 'idle' });
    }
  };

  const onFirstCommit = async (text) => {
    const t = (text || '').trim();
    if (!t) return;
    if (showLongitudinal) {
      if (longitudinalSession.mode === 'growth') {
        saveGrowthReflectionNote(t);
      } else if (longitudinalSession.mode === 'forward') {
        saveForwardBriefNote(t);
      } else if (longitudinalSession.mode === 'friction') {
        saveFrictionWorkNote(t);
      }
      goHome();
      return;
    }
    setFirstTranscript(t);
    pushConversation('user', t);

    if (sessionFreeform) {
      await runProcess([t], [{ role: 'user', content: t }], true);
      return;
    }

    setPhase('thinkingMini');
    setFollowupError('');
    try {
      await new Promise((r) => setTimeout(r, 800));
      const data = await postJson('/api/followup', {
        user,
        firstTranscript: t,
        conversationHistory: [{ role: 'user', content: t }],
      });
      setFollowUpQuestion(data.followUpQuestion);
      pushConversation('assistant', data.followUpQuestion);
      setPhase('followup');
    } catch (e) {
      setFollowupError(e.message || 'Follow-up failed');
      setPhase('prompt');
    }
  };

  const onSecondCommit = async (text) => {
    const t = (text || '').trim();
    if (!t) return;
    pushConversation('user', t);
    const conversationHistory = [
      { role: 'user', content: firstTranscript },
      { role: 'assistant', content: followUpQuestion },
      { role: 'user', content: t },
    ];
    await runProcess([firstTranscript, t], conversationHistory, false);
  };

  if (showOutcome && dueEntry) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between px-5 pt-6">
          <SecondaryButton className="py-2 text-sm" onClick={() => goHome()}>
            ← Home
          </SecondaryButton>
        </div>
        {outcomeError && (
          <div className="mx-5 mt-4 rounded-card border border-briefly-border bg-briefly-redBg p-3 text-sm text-briefly-red">
            {outcomeError}
          </div>
        )}
        <OutcomeCheckIn
          sessionsAgo={sessionsAgoForDue}
          actionTitle={dueEntry.action.title}
          onResolved={({ outcome, outcomeLabel }) => {
            setOutcomeError('');
            resolveActionOutcome(dueEntry.id, { outcome, outcomeLabel });
          }}
          onError={(msg) => setOutcomeError(msg)}
        />
      </div>
    );
  }

  if (showLongitudinal) {
    return (
      <div className="mx-auto max-w-lg px-5 pb-16 pt-6">
        <div className="flex items-center justify-between">
          <SecondaryButton className="py-2 text-sm" onClick={() => goHome()}>
            ← Home
          </SecondaryButton>
        </div>
        <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">
          Longitudinal note
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold leading-snug text-briefly-text">
          {longitudinalSession.prompt}
        </h1>
        <p className="mt-3 text-center text-sm text-briefly-muted">One pass — no follow-up question.</p>
        <VoiceRecorder onCommit={onFirstCommit} />
      </div>
    );
  }

  if (phase === 'processing') {
    return (
      <div className="mx-auto max-w-lg px-5 pb-10 pt-6">
        {processError && (
          <div className="mb-6 rounded-card border border-briefly-border bg-briefly-redBg p-3 text-sm text-briefly-red">
            {processError}
          </div>
        )}
        {!processError && <ThinkingAnimation />}
        {processError && (
          <div className="mt-8 flex justify-center">
            <SecondaryButton onClick={() => goHome()}>Back home</SecondaryButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <SecondaryButton className="py-2 text-sm" onClick={() => goHome()}>
          ← Home
        </SecondaryButton>
      </div>

      {phase === 'thinkingMini' && (
        <div className="mt-16 flex flex-col items-center text-sm text-briefly-muted">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-briefly-muted briefly-dot-pulse" />
            <span
              className="h-2 w-2 rounded-full bg-briefly-muted briefly-dot-pulse"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-2 w-2 rounded-full bg-briefly-muted briefly-dot-pulse"
              style={{ animationDelay: '300ms' }}
            />
          </span>
          <p className="mt-3">MyHustle is thinking...</p>
        </div>
      )}

      {(phase === 'prompt' || phase === 'listening') && (
        <div className="mt-10">
          {sessionFreeform && (
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-briefly-amber">
              Open check-in
            </p>
          )}
          <h1 className="text-center text-2xl font-semibold leading-snug text-briefly-text">
            {openingLoading ? 'Getting your question…' : openingQuestion}
          </h1>
          {sessionFreeform && !openingLoading && (
            <p className="mt-3 text-center text-sm text-briefly-muted">
              No prompts from earlier sessions here — say whatever you want: wins, worries, random notes, or new
              ideas. One pass, then MyHustle turns it into an insight.
            </p>
          )}
          {!sessionFreeform && memory.length === 0 && !openingLoading && (
            <p className="mt-3 text-center text-sm text-briefly-muted">
              Anything that comes to mind — good or bad, big or small.
            </p>
          )}
          {openingError && <p className="mt-3 text-center text-xs text-briefly-muted">{openingError}</p>}
          {followupError && <p className="mt-3 text-center text-xs text-briefly-red">{followupError}</p>}
          {!openingLoading && phase !== 'thinkingMini' && (
            <VoiceRecorder
              showWaveform={phase === 'listening'}
              disabled={openingLoading || phase === 'thinkingMini'}
              onRecordingStart={() => setPhase('listening')}
              onCommit={onFirstCommit}
            />
          )}
          {phase === 'listening' && showStopHint && (
            <p className="mt-4 text-center text-xs font-semibold text-briefly-muted">Tap to stop</p>
          )}
        </div>
      )}

      {(phase === 'followup' || phase === 'listeningFollowup') && (
        <div className="mt-10">
          <Card className="border-l-4 border-l-briefly-amber p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">One follow-up</p>
            <p className="mt-2 text-lg font-medium leading-snug text-briefly-text">{followUpQuestion}</p>
          </Card>
          <VoiceRecorder
            showWaveform={phase === 'listeningFollowup'}
            onRecordingStart={() => setPhase('listeningFollowup')}
            onCommit={onSecondCommit}
          />
          {phase === 'listeningFollowup' && showStopHint && (
            <p className="mt-4 text-center text-xs font-semibold text-briefly-muted">Tap to stop</p>
          )}
        </div>
      )}
    </div>
  );
}
