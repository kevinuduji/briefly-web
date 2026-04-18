import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SecondaryButton } from '../ui/SecondaryButton';
import { AddTaskInput, buildReminderDateFromChoice } from '../todo/AddTaskInput';
import { CompletedSection } from '../todo/CompletedSection';
import { TodoItem } from '../todo/TodoItem';
import { newMemoryId } from '../../lib/memoryIds';

function sortPendingTasks(list) {
  const ai = list.filter((t) => t.source === 'ai').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const usr = list
    .filter((t) => t.source === 'user')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return [...ai, ...usr];
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted" style={{ letterSpacing: '0.04em' }}>
      {children}
    </p>
  );
}

export function TodoScreen() {
  const { todos, reminders, activeHustle, navigate, dispatch } = useApp();
  const [somedayOpen, setSomedayOpen] = useState(false);
  const prevSomedayCountRef = useRef(null);

  const hustleId = activeHustle?.id;

  const scoped = useMemo(
    () => (hustleId ? todos.filter((t) => t.hustleId === hustleId) : []),
    [todos, hustleId]
  );

  const remindersById = useMemo(() => {
    const m = new Map();
    reminders.forEach((r) => m.set(r.id, r));
    return m;
  }, [reminders]);

  const pendingThisWeek = useMemo(
    () => sortPendingTasks(scoped.filter((t) => t.status === 'pending' && t.zone === 'this-week')),
    [scoped]
  );

  const pendingSomeday = useMemo(
    () => sortPendingTasks(scoped.filter((t) => t.status === 'pending' && t.zone === 'someday')),
    [scoped]
  );

  useEffect(() => {
    const n = pendingSomeday.length;
    if (prevSomedayCountRef.current === null) {
      prevSomedayCountRef.current = n;
      if (n > 0) setSomedayOpen(true);
      return;
    }
    if (prevSomedayCountRef.current === 0 && n > 0) setSomedayOpen(true);
    if (prevSomedayCountRef.current > 0 && n === 0) setSomedayOpen(false);
    prevSomedayCountRef.current = n;
  }, [pendingSomeday.length]);

  const completedLast7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return scoped.filter(
      (t) =>
        t.status === 'done' &&
        t.completedAt &&
        new Date(t.completedAt).getTime() >= cutoff
    );
  }, [scoped]);

  const hustleName = activeHustle?.name?.trim() || 'this hustle';

  const addForZone = (targetZone) => {
    return ({ title, reminderChoice, customTime }) => {
      if (!activeHustle?.id) return;
      const todoId = newMemoryId();
      let remId = null;
      if (reminderChoice) {
        remId = newMemoryId();
        const dt = buildReminderDateFromChoice(reminderChoice, customTime);
        dispatch({
          type: 'SET_REMINDER',
          reminder: {
            id: remId,
            hustleId: activeHustle.id,
            actionTitle: title,
            reminderTime: dt.toISOString(),
            actionId: `todo-${todoId}`,
            status: 'pending',
          },
        });
      }
      dispatch({
        type: 'ADD_TODO',
        todo: {
          id: todoId,
          hustleId: activeHustle.id,
          title,
          source: 'user',
          sourceSessionDate: null,
          sourceInsight: null,
          zone: targetZone,
          status: 'pending',
          completedAt: null,
          reminderId: remId,
          createdAt: new Date().toISOString(),
        },
      });
    };
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg px-5 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <SecondaryButton className="py-2 text-sm" onClick={() => navigate('home')}>
          ← Home
        </SecondaryButton>
        <div className="flex flex-1 items-center justify-center gap-2">
          <span className="text-lg" aria-hidden>
            {activeHustle?.emoji || '📌'}
          </span>
          <span className="text-base font-semibold text-briefly-text">Tasks</span>
        </div>
        <span className="w-[72px]" aria-hidden />
      </div>

      <div className="mt-10 space-y-8">
        <div>
          <SectionLabel>THIS WEEK</SectionLabel>
          {pendingThisWeek.length === 0 && (
            <p className="mt-2 text-[13px] text-briefly-muted">
              Your week is clear. Add what will move {hustleName} forward — one honest line is enough.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {pendingThisWeek.map((todo) => (
              <div key={todo.id} className="briefly-fade-in-up">
                <TodoItem todo={todo} reminder={todo.reminderId ? remindersById.get(todo.reminderId) ?? null : null} />
              </div>
            ))}
          </div>
          <AddTaskInput zone="this-week" hustleName={hustleName} onSubmit={addForZone('this-week')} />
        </div>

        <div>
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setSomedayOpen((v) => !v)}
          >
            <SectionLabel>SOMEDAY</SectionLabel>
            <span className="text-xs font-semibold text-briefly-muted">{somedayOpen ? 'Hide' : 'Show'}</span>
          </button>
          {pendingSomeday.length === 0 && somedayOpen && (
            <p className="mt-2 text-[13px] text-briefly-muted">
              A parking lot for ideas that shouldn’t steal focus this week. Add something — no judgment.
            </p>
          )}
          {somedayOpen && (
            <>
              <div className="mt-4 space-y-3">
                {pendingSomeday.map((todo) => (
                  <div key={todo.id} className="briefly-fade-in-up">
                    <TodoItem todo={todo} reminder={todo.reminderId ? remindersById.get(todo.reminderId) ?? null : null} />
                  </div>
                ))}
              </div>
              <AddTaskInput zone="someday" hustleName={hustleName} onSubmit={addForZone('someday')} />
            </>
          )}
        </div>

        <CompletedSection items={completedLast7} remindersById={remindersById} />
      </div>
    </div>
  );
}
