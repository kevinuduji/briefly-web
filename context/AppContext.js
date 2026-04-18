import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { computeStreak, todayStr, yesterdayStr } from '../lib/dates';
import { migrateMemoryIds, newMemoryId } from '../lib/memoryIds';
import {
  buildOutcomeContextString,
  buildPatternContextString,
  memoryChronological,
  migrateMemoryLongitudinal,
  normalizeMemoryAction,
} from '../lib/longitudinalUtils';

const STORAGE_KEY = 'myhustle_state_v1';
const LEGACY_KEYS = ['briefly_state_v3', 'briefly_state_v2'];

export const defaultSession = {
  conversationHistory: [],
  processedInsight: null,
  status: 'idle',
};

function newHustleId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `hustle-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function hustleToApiUser(hustle) {
  if (!hustle) {
    return { businessType: '', businessDescription: '', primaryGoal: null, name: null };
  }
  return {
    businessType: String(hustle.businessType || ''),
    businessDescription: '',
    primaryGoal: hustle.primaryGoal ?? null,
    name: hustle.name ?? null,
    emoji: hustle.emoji ?? '',
  };
}

function createEmptyHustle(partial) {
  const now = new Date().toISOString();
  return {
    id: partial.id || newHustleId(),
    name: String(partial.name || '').trim() || 'My hustle',
    emoji: partial.emoji || '📌',
    businessType: String(partial.businessType || '').trim(),
    primaryGoal: partial.primaryGoal ?? null,
    createdAt: partial.createdAt || now,
    lastSessionAt: partial.lastSessionAt ?? null,
    streak: Number(partial.streak) || 0,
    memory: Array.isArray(partial.memory) ? partial.memory : [],
    forwardBrief: partial.forwardBrief ?? null,
    forwardBriefReady: Boolean(partial.forwardBriefReady),
    lastForwardBriefAt: partial.lastForwardBriefAt ?? null,
    growthReflection: partial.growthReflection ?? null,
    growthReflectionReady: Boolean(partial.growthReflectionReady),
    patternsDigest: partial.patternsDigest ?? null,
    patternsWorkNote: partial.patternsWorkNote ?? null,
    openingPromptVariant: partial.openingPromptVariant || 'day',
  };
}

function initialAppState() {
  return {
    onboardingComplete: false,
    onboardingStep: 1,
    hustles: [],
    activeHustleId: null,
    currentSession: { ...defaultSession },
    crossHustleObservation: null,
    crossHustleObservationDate: null,
    currentScreen: 'onboarding',
    sessionSeedPrompt: null,
    sessionFreeform: false,
    longitudinalSession: null,
    todos: [],
    reminders: [],
  };
}

function normalizeScreen(saved, onboardingComplete) {
  if (!onboardingComplete) return 'onboarding';
  const s = saved.currentScreen || 'home';
  if (s === 'session' || s === 'insight' || s === 'patterns') return 'home';
  if (
    ['onboarding', 'home', 'session', 'insight', 'history', 'patterns', 'portfolio', 'new-hustle', 'todo'].includes(
      s
    )
  ) {
    return s;
  }
  return 'home';
}

function migrateLegacyToHustles(saved) {
  const memory = migrateMemoryLongitudinal(migrateMemoryIds(saved.memory || []));
  const user = saved.user || {};
  const primary = createEmptyHustle({
    name: (user.name && String(user.name).trim()) || (user.businessType && String(user.businessType).trim()) || 'My hustle',
    emoji: '📌',
    businessType: user.businessType || '',
    primaryGoal: user.primaryGoal ?? null,
    memory,
    streak: computeStreak(memory),
    forwardBrief: saved.forwardBrief ?? null,
    forwardBriefReady: Boolean(saved.forwardBriefReady),
    lastForwardBriefAt: saved.lastForwardBriefAt ?? null,
    growthReflection: saved.growthReflection ?? null,
    growthReflectionReady: Boolean(saved.growthReflectionReady),
    patternsDigest: saved.patternsDigest ?? null,
    patternsWorkNote: saved.patternsWorkNote ?? null,
  });
  if (memory[0]?.date) {
    primary.lastSessionAt = new Date(`${memory[0].date}T12:00:00`).toISOString();
  }
  return {
    hustles: [primary],
    activeHustleId: primary.id,
  };
}

function hydratePersisted(saved) {
  if (saved.hustles && Array.isArray(saved.hustles) && saved.hustles.length > 0) {
    const hustles = saved.hustles.map((h) =>
      createEmptyHustle({
        ...h,
        memory: migrateMemoryLongitudinal(migrateMemoryIds(h.memory || [])),
        streak: computeStreak(migrateMemoryLongitudinal(migrateMemoryIds(h.memory || []))),
      })
    );
    let activeHustleId = saved.activeHustleId;
    if (!activeHustleId || !hustles.some((h) => h.id === activeHustleId)) {
      activeHustleId = hustles[0].id;
    }
    return { hustles, activeHustleId };
  }
  return migrateLegacyToHustles(saved);
}

function appReducer(state, action) {
  const activeId = state.activeHustleId;

  const withActiveHustle = (fn) => {
    const idx = state.hustles.findIndex((h) => h.id === activeId);
    if (idx === -1) return state;
    const nextHustles = [...state.hustles];
    nextHustles[idx] = fn(nextHustles[idx]);
    return { ...state, hustles: nextHustles };
  };

  switch (action.type) {
    case 'HYDRATE': {
      return { ...state, ...action.payload };
    }
    case 'SET_ACTIVE_HUSTLE': {
      const id = action.id;
      if (!state.hustles.some((h) => h.id === id)) return state;
      return {
        ...state,
        activeHustleId: id,
        currentScreen: 'home',
        currentSession: { ...defaultSession },
        sessionSeedPrompt: null,
        sessionFreeform: false,
        longitudinalSession: null,
      };
    }
    case 'NAVIGATE':
      return { ...state, currentScreen: action.screen };
    case 'GO_HOME':
      return {
        ...state,
        currentScreen: 'home',
        currentSession: { ...defaultSession },
        sessionSeedPrompt: null,
        sessionFreeform: false,
        longitudinalSession: null,
      };
    case 'SET_ONBOARDING_STEP':
      return { ...state, onboardingStep: action.step };
    case 'ADVANCE_ONBOARDING':
      return { ...state, onboardingStep: Math.min(4, (state.onboardingStep || 1) + 1) };
    case 'ADD_HUSTLE': {
      const h = createEmptyHustle(action.hustle);
      return {
        ...state,
        hustles: [...state.hustles, h],
        activeHustleId: h.id,
      };
    }
    case 'COMPLETE_ONBOARDING_TO_PORTFOLIO': {
      const oneHustle = state.hustles.length === 1;
      return {
        ...state,
        onboardingComplete: true,
        onboardingStep: 4,
        currentScreen: oneHustle ? 'home' : 'portfolio',
        currentSession: { ...defaultSession },
        sessionSeedPrompt: null,
        sessionFreeform: false,
        longitudinalSession: null,
      };
    }
    case 'RESET_APP':
      return { ...initialAppState() };
    case 'START_SESSION':
      return {
        ...state,
        currentScreen: 'session',
        sessionSeedPrompt: action.sessionSeedPrompt,
        sessionFreeform: Boolean(action.freeform),
        longitudinalSession: null,
        currentSession: {
          conversationHistory: [],
          processedInsight: null,
          status: 'idle',
        },
      };
    case 'START_LONGITUDINAL_SESSION':
      return {
        ...state,
        currentScreen: 'session',
        sessionSeedPrompt: null,
        sessionFreeform: false,
        longitudinalSession: action.longitudinalSession,
        currentSession: {
          conversationHistory: [],
          processedInsight: null,
          status: 'idle',
        },
      };
    case 'UPDATE_SESSION':
      return {
        ...state,
        currentSession: { ...state.currentSession, ...action.patch },
      };
    case 'PUSH_CONVERSATION':
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          conversationHistory: [
            ...state.currentSession.conversationHistory,
            { role: action.role, content: action.content },
          ],
        },
      };
    case 'SET_PROCESSED_INSIGHT':
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          processedInsight: action.insight,
          status: 'insight',
        },
      };
    case 'CLEAR_SESSION_SEED':
      return { ...state, sessionSeedPrompt: null };
    case 'SET_PATTERNS_DIGEST':
      return withActiveHustle((h) => ({
        ...h,
        patternsDigest: action.digest,
      }));
    case 'SAVE_GROWTH_REFLECTION_NOTE':
      return withActiveHustle((h) => ({
        ...h,
        growthReflection: h.growthReflection
          ? { ...h.growthReflection, reflectionNote: action.text }
          : h.growthReflection,
        growthReflectionReady: false,
      }));
    case 'SAVE_FORWARD_BRIEF_NOTE':
      return withActiveHustle((h) => ({
        ...h,
        forwardBrief: h.forwardBrief ? { ...h.forwardBrief, followThroughNote: action.text } : h.forwardBrief,
      }));
    case 'SAVE_FRICTION_WORK_NOTE':
      return withActiveHustle((h) => ({
        ...h,
        patternsWorkNote: action.text,
      }));
    case 'APPLY_FORWARD_BRIEF_API':
      return withActiveHustle((h) => ({
        ...h,
        forwardBrief: action.data,
        forwardBriefReady: Boolean(
          action.data?.observation && action.data?.preparationAction && action.data?.focusQuestion
        ),
        lastForwardBriefAt: new Date().toISOString(),
      }));
    case 'COMMIT_TODAY_MEMORY_NAV': {
      const { processed, actionStatus, primaryCompleted = false, todoFromInsight } = action;
      const date = todayStr();
      const nextState = withActiveHustle((h) => {
        const mem = h.memory;
        const nextLen = mem.length + 1;
        const doneNow = Boolean(primaryCompleted) || actionStatus === 'done';
        const resolvedStatus = doneNow ? 'done' : actionStatus;
        const extras = Array.isArray(processed.extraActions)
          ? processed.extraActions
              .slice(0, 2)
              .map((a) => ({
                title: String(a?.title || '').trim(),
                how: String(a?.how || '').trim(),
                deadlineLabel: ['Today', 'This week', 'Before your next session'].includes(a?.deadlineLabel)
                  ? a.deadlineLabel
                  : 'This week',
              }))
              .filter((a) => a.title && a.how)
          : [];
        const actionCore = normalizeMemoryAction({
          title: processed.action.title,
          how: processed.action.how,
          deadline: processed.action.deadlineLabel,
          markedDoneAt: doneNow ? new Date().toISOString() : null,
          followUpDue: doneNow ? nextLen + 3 : null,
          outcome: null,
          outcomeLabel: null,
        });
        const entry = {
          id: newMemoryId(),
          date,
          headline: processed.headline,
          theOneThing: processed.insight,
          action: actionCore,
          extraActions: extras.length ? extras : undefined,
          actionStatus: resolvedStatus,
          signals: processed.signals || [],
          moodScore: processed.moodScore,
          dayScore: processed.dayScore,
          followUpQuestion: processed.followUpQuestion ?? null,
          patternNote: processed.patternNote ?? null,
        };
        const nextMem = [entry, ...mem];
        return {
          ...h,
          memory: nextMem,
          streak: computeStreak(nextMem),
          lastSessionAt: new Date().toISOString(),
          openingPromptVariant: h.openingPromptVariant === 'day' ? 'week' : 'day',
        };
      });
      let withTodo = nextState;
      if (
        todoFromInsight &&
        actionStatus === 'pending' &&
        !primaryCompleted &&
        activeId &&
        processed?.action?.title
      ) {
        const rid = todoFromInsight.reminderId ?? null;
        withTodo = {
          ...withTodo,
          todos: [
            ...withTodo.todos,
            {
              id: newMemoryId(),
              hustleId: activeId,
              title: String(processed.action.title).trim(),
              source: 'ai',
              sourceSessionDate: date,
              sourceInsight:
                typeof todoFromInsight.sourceInsight === 'string'
                  ? todoFromInsight.sourceInsight
                  : null,
              zone: 'this-week',
              status: 'pending',
              completedAt: null,
              reminderId: rid,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
      return {
        ...withTodo,
        currentScreen: 'home',
        currentSession: { ...defaultSession },
        sessionSeedPrompt: null,
        sessionFreeform: false,
        longitudinalSession: null,
      };
    }
    case 'UPDATE_TODAY_MEMORY_PARTIAL': {
      const date = todayStr();
      return withActiveHustle((h) => {
        const idx = h.memory.findIndex((m) => m.date === date);
        if (idx === -1) return h;
        const next = [...h.memory];
        next[idx] = { ...next[idx], ...action.patch };
        return { ...h, memory: next };
      });
    }
    case 'MARK_YESTERDAY_DONE': {
      const y = yesterdayStr();
      return withActiveHustle((h) => {
        const idx = h.memory.findIndex((m) => m.date === y);
        if (idx === -1) return h;
        const next = [...h.memory];
        const cur = next[idx];
        const mergedAction = normalizeMemoryAction({
          ...cur.action,
          markedDoneAt: new Date().toISOString(),
          followUpDue: h.memory.length + 3,
        });
        next[idx] = { ...cur, actionStatus: 'done', action: mergedAction };
        return { ...h, memory: next };
      });
    }
    case 'MARK_YESTERDAY_SKIPPED': {
      const y = yesterdayStr();
      return withActiveHustle((h) => {
        const idx = h.memory.findIndex((m) => m.date === y);
        if (idx === -1) return h;
        const next = [...h.memory];
        next[idx] = { ...next[idx], actionStatus: 'skipped' };
        return { ...h, memory: next };
      });
    }
    case 'RESOLVE_ACTION_OUTCOME':
      return withActiveHustle((h) => ({
        ...h,
        memory: h.memory.map((m) =>
          m.id === action.memoryEntryId
            ? {
                ...m,
                action: normalizeMemoryAction({
                  ...m.action,
                  outcome: String(action.outcome || '').trim(),
                  outcomeLabel: action.outcomeLabel,
                }),
              }
            : m
        ),
      }));
    case 'SET_GROWTH_REFLECTION_API':
      return withActiveHustle((h) => ({
        ...h,
        growthReflection: action.data,
        growthReflectionReady: action.ready,
      }));
    case 'SET_CROSS_HUSTLE_OBSERVATION':
      return {
        ...state,
        crossHustleObservation: action.observation,
        crossHustleObservationDate: action.date,
      };
    case 'SET_REMINDER': {
      const r = action.reminder;
      if (!r?.id) return state;
      const next = state.reminders.filter((x) => x.id !== r.id);
      return {
        ...state,
        reminders: [
          ...next,
          {
            id: r.id,
            hustleId: String(r.hustleId || ''),
            actionTitle: String(r.actionTitle || '').trim(),
            reminderTime: String(r.reminderTime || ''),
            actionId: r.actionId != null ? String(r.actionId) : 'primary',
            status: r.status === 'dismissed' ? 'dismissed' : 'pending',
          },
        ],
      };
    }
    case 'DISMISS_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.id ? { ...r, status: 'dismissed' } : r
        ),
      };
    case 'UPDATE_REMINDER_TIME': {
      const { id, reminderTime } = action;
      const iso =
        reminderTime instanceof Date
          ? reminderTime.toISOString()
          : String(reminderTime || '');
      if (!id || !iso) return state;
      return {
        ...state,
        reminders: state.reminders.map((r) => (r.id === id ? { ...r, reminderTime: iso } : r)),
      };
    }
    case 'ADD_TODO': {
      const todo = action.todo;
      if (!todo?.id) return state;
      return { ...state, todos: [...state.todos, todo] };
    }
    case 'COMPLETE_TODO': {
      if (!action.id) return state;
      const when = new Date().toISOString();
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, status: 'done', completedAt: when } : t
        ),
      };
    }
    default:
      return state;
  }
}

async function postJsonSilent(url, body) {
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

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, dispatch] = useReducer(appReducer, undefined, initialAppState);
  const longitudinalHydrationLockRef = useRef(false);
  const prevHeadIdRef = useRef(null);
  const prevActiveIdRef = useRef(null);

  useEffect(() => {
    if (prevActiveIdRef.current !== state.activeHustleId) {
      prevActiveIdRef.current = state.activeHustleId;
      const mh =
        state.hustles.find((h) => h.id === state.activeHustleId)?.memory ?? [];
      prevHeadIdRef.current = mh[0]?.id ?? null;
    }
  }, [state.activeHustleId, state.hustles]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        raw = localStorage.getItem(k);
        if (raw) break;
      }
    }
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const saved = JSON.parse(raw);
      const { hustles, activeHustleId } = hydratePersisted(saved);
      const nextScreen = normalizeScreen(saved, saved.onboardingComplete);
        dispatch({
        type: 'HYDRATE',
        payload: {
          onboardingComplete: Boolean(saved.onboardingComplete),
          onboardingStep: saved.onboardingStep || 1,
          hustles,
          activeHustleId,
          currentScreen: nextScreen,
          currentSession: { ...defaultSession },
          crossHustleObservation: saved.crossHustleObservation ?? null,
          crossHustleObservationDate: saved.crossHustleObservationDate ?? null,
          sessionSeedPrompt: null,
          sessionFreeform: false,
          longitudinalSession: null,
          todos: Array.isArray(saved.todos) ? saved.todos : [],
          reminders: Array.isArray(saved.reminders) ? saved.reminders : [],
        },
      });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const t = setTimeout(() => {
      try {
        const snapshot = {
          onboardingComplete: state.onboardingComplete,
          onboardingStep: state.onboardingStep,
          hustles: state.hustles,
          activeHustleId: state.activeHustleId,
          currentScreen: state.currentScreen,
          crossHustleObservation: state.crossHustleObservation,
          crossHustleObservationDate: state.crossHustleObservationDate,
          todos: state.todos,
          reminders: state.reminders,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [state, hydrated]);

  const activeHustle = useMemo(
    () => state.hustles.find((h) => h.id === state.activeHustleId) || null,
    [state.hustles, state.activeHustleId]
  );

  const memory = activeHustle?.memory ?? [];
  const user = useMemo(() => hustleToApiUser(activeHustle), [activeHustle]);

  useEffect(() => {
    if (!hydrated) return;
    if (!longitudinalHydrationLockRef.current) {
      longitudinalHydrationLockRef.current = true;
      prevHeadIdRef.current = memory[0]?.id ?? null;
      return;
    }
    const headId = memory[0]?.id ?? null;
    if (!headId || headId === prevHeadIdRef.current) return;
    prevHeadIdRef.current = headId;

    const L = memory.length;
    const chronological = memoryChronological(memory);
    const userPayload = hustleToApiUser(activeHustle);

    (async () => {
      if (L > 0 && L % 5 === 0 && activeHustle) {
        try {
          const data = await postJsonSilent('/api/growth-reflection', {
            user: userPayload,
            earlyMemory: chronological.slice(0, 3),
            recentMemory: chronological.slice(-3),
          });
          const ready = Boolean(data?.thenQuote && data?.nowObservation && data?.reflectionPrompt);
          dispatch({
            type: 'SET_GROWTH_REFLECTION_API',
            data,
            ready,
          });
        } catch {
          dispatch({
            type: 'SET_GROWTH_REFLECTION_API',
            data: null,
            ready: false,
          });
        }
      }

      if (L > 0 && L % 7 === 0 && activeHustle) {
        try {
          const data = await postJsonSilent('/api/forward-brief', {
            user: userPayload,
            memory: chronological,
          });
          dispatch({ type: 'APPLY_FORWARD_BRIEF_API', data });
        } catch {
          /* keep prior brief */
        }
      }
    })();
  }, [hydrated, memory, activeHustle]);

  const todayKey = todayStr();
  const yesterdayKey = yesterdayStr();

  const yesterdayMemory = useMemo(
    () => memory.find((m) => m.date === yesterdayKey) || null,
    [memory, yesterdayKey]
  );

  const latestMemory = memory[0] || null;

  const streak = useMemo(() => computeStreak(memory), [memory]);

  const growthReflection = activeHustle?.growthReflection ?? null;
  const growthReflectionReady = Boolean(activeHustle?.growthReflectionReady);
  const forwardBrief = activeHustle?.forwardBrief ?? null;
  const forwardBriefReady = Boolean(activeHustle?.forwardBriefReady);
  const lastForwardBriefAt = activeHustle?.lastForwardBriefAt ?? null;
  const patternsDigest = activeHustle?.patternsDigest ?? null;
  const patternsWorkNote = activeHustle?.patternsWorkNote ?? null;

  const outcomeContextForProcess = useMemo(() => buildOutcomeContextString(memory), [memory]);

  const patternContextForProcess = useMemo(
    () => buildPatternContextString(patternsDigest),
    [patternsDigest]
  );

  const navigate = useCallback((screen) => {
    dispatch({ type: 'NAVIGATE', screen });
  }, []);

  const goHome = useCallback(() => {
    dispatch({ type: 'GO_HOME' });
  }, []);

  const setOnboardingStep = useCallback((step) => {
    dispatch({ type: 'SET_ONBOARDING_STEP', step });
  }, []);

  const advanceOnboarding = useCallback(() => {
    dispatch({ type: 'ADVANCE_ONBOARDING' });
  }, []);

  const finishOnboardingToPortfolio = useCallback(() => {
    dispatch({ type: 'COMPLETE_ONBOARDING_TO_PORTFOLIO' });
  }, []);

  const resetToOnboarding = useCallback(() => {
    dispatch({ type: 'RESET_APP' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const startSession = useCallback(({ seedPrompt, freeform } = {}) => {
    const isFree = Boolean(freeform);
    dispatch({
      type: 'START_SESSION',
      sessionSeedPrompt: isFree ? null : seedPrompt ?? null,
      freeform: isFree,
    });
  }, []);

  const startLongitudinalVoiceSession = useCallback(({ mode, prompt }) => {
    dispatch({
      type: 'START_LONGITUDINAL_SESSION',
      longitudinalSession: { mode, prompt: String(prompt || '').trim() },
    });
  }, []);

  const updateSession = useCallback((patch) => {
    dispatch({ type: 'UPDATE_SESSION', patch });
  }, []);

  const pushConversation = useCallback((role, content) => {
    dispatch({ type: 'PUSH_CONVERSATION', role, content });
  }, []);

  const setProcessedInsight = useCallback((insight) => {
    dispatch({ type: 'SET_PROCESSED_INSIGHT', insight });
  }, []);

  const clearSessionSeed = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION_SEED' });
  }, []);

  const setPatternsDigestFromPatterns = useCallback((payload) => {
    const s = buildPatternContextString(
      typeof payload === 'string'
        ? payload
        : `Strength signal: ${payload?.strengths?.[0] || ''}. Recurring friction: ${payload?.frictions?.[0]?.observation || ''}.`
    );
    dispatch({ type: 'SET_PATTERNS_DIGEST', digest: s });
  }, []);

  const saveGrowthReflectionNote = useCallback((text) => {
    const t = String(text || '').trim();
    if (!t) return;
    dispatch({ type: 'SAVE_GROWTH_REFLECTION_NOTE', text: t });
  }, []);

  const saveForwardBriefNote = useCallback((text) => {
    const t = String(text || '').trim();
    if (!t) return;
    dispatch({ type: 'SAVE_FORWARD_BRIEF_NOTE', text: t });
  }, []);

  const saveFrictionWorkNote = useCallback((text) => {
    const t = String(text || '').trim();
    if (!t) return;
    dispatch({ type: 'SAVE_FRICTION_WORK_NOTE', text: t });
  }, []);

  const applyForwardBriefFromApi = useCallback((data) => {
    dispatch({ type: 'APPLY_FORWARD_BRIEF_API', data });
  }, []);

  const commitTodayMemory = useCallback(({ processed, actionStatus, primaryCompleted = false, todoFromInsight }) => {
    dispatch({
      type: 'COMMIT_TODAY_MEMORY_NAV',
      processed,
      actionStatus,
      primaryCompleted,
      todoFromInsight,
    });
  }, []);

  const updateTodayMemoryPartial = useCallback((patch) => {
    dispatch({ type: 'UPDATE_TODAY_MEMORY_PARTIAL', patch });
  }, []);

  const markYesterdayActionDone = useCallback(() => {
    dispatch({ type: 'MARK_YESTERDAY_DONE' });
  }, []);

  const markYesterdayActionSkipped = useCallback(() => {
    dispatch({ type: 'MARK_YESTERDAY_SKIPPED' });
  }, []);

  const resolveActionOutcome = useCallback((memoryEntryId, { outcome, outcomeLabel }) => {
    dispatch({
      type: 'RESOLVE_ACTION_OUTCOME',
      memoryEntryId,
      outcome,
      outcomeLabel,
    });
  }, []);

  const addHustle = useCallback((hustlePayload) => {
    dispatch({ type: 'ADD_HUSTLE', hustle: hustlePayload });
  }, []);

  const setActiveHustle = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE_HUSTLE', id });
  }, []);

  const setCrossHustleObservation = useCallback((observation, dateIso) => {
    dispatch({
      type: 'SET_CROSS_HUSTLE_OBSERVATION',
      observation,
      date: dateIso,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      dispatch,
      user,
      memory,
      activeHustle,
      hydrated,
      dispatch,
      todayKey,
      yesterdayKey,
      yesterdayMemory,
      latestMemory,
      streak,
      growthReflection,
      growthReflectionReady,
      forwardBrief,
      forwardBriefReady,
      lastForwardBriefAt,
      patternsDigest,
      patternsWorkNote,
      outcomeContextForProcess,
      patternContextForProcess,
      setOnboardingStep,
      advanceOnboarding,
      finishOnboardingToPortfolio,
      addHustle,
      setActiveHustle,
      navigate,
      goHome,
      resetToOnboarding,
      startSession,
      startLongitudinalVoiceSession,
      updateSession,
      pushConversation,
      setProcessedInsight,
      clearSessionSeed,
      commitTodayMemory,
      updateTodayMemoryPartial,
      markYesterdayActionDone,
      markYesterdayActionSkipped,
      resolveActionOutcome,
      setPatternsDigestFromPatterns,
      saveGrowthReflectionNote,
      saveForwardBriefNote,
      saveFrictionWorkNote,
      applyForwardBriefFromApi,
      setCrossHustleObservation,
    }),
    [
      state,
      dispatch,
      user,
      memory,
      activeHustle,
      hydrated,
      todayKey,
      yesterdayKey,
      yesterdayMemory,
      latestMemory,
      streak,
      growthReflection,
      growthReflectionReady,
      forwardBrief,
      forwardBriefReady,
      lastForwardBriefAt,
      patternsDigest,
      patternsWorkNote,
      outcomeContextForProcess,
      patternContextForProcess,
      setOnboardingStep,
      advanceOnboarding,
      finishOnboardingToPortfolio,
      addHustle,
      setActiveHustle,
      navigate,
      goHome,
      resetToOnboarding,
      startSession,
      startLongitudinalVoiceSession,
      updateSession,
      pushConversation,
      setProcessedInsight,
      clearSessionSeed,
      commitTodayMemory,
      updateTodayMemoryPartial,
      markYesterdayActionDone,
      markYesterdayActionSkipped,
      resolveActionOutcome,
      setPatternsDigestFromPatterns,
      saveGrowthReflectionNote,
      saveForwardBriefNote,
      saveFrictionWorkNote,
      applyForwardBriefFromApi,
      setCrossHustleObservation,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}

export function useActiveHustle() {
  const { activeHustle } = useApp();
  return activeHustle;
}

export function useActiveMemory() {
  const { memory } = useApp();
  return memory;
}

export function useHustleCount() {
  const { hustles } = useApp();
  return hustles.length;
}
