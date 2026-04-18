import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';

function formatShortCheckInDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(`${String(isoDate)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(isoDate);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatFriendlyReminderLabel(iso) {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTarget = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const diffDays = Math.round((startTarget - startToday) / 86400000);
  const time = t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0 && t.getHours() >= 17) return `Tonight at ${time}`;
  if (diffDays === 1) return `Tomorrow at ${time}`;
  if (diffDays === 0) return `Today at ${time}`;
  return t.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

function buildNextOccurrenceDateFromTimeString(timeStr) {
  const [hh, mm] = String(timeStr || '09:00')
    .split(':')
    .map((x) => Number(x));
  const now = new Date();
  const d = new Date(now);
  d.setHours(hh || 9, mm || 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * @param {{ todo: object, reminder: object | null }} props
 */
export function TodoItem({ todo, reminder }) {
  const { dispatch } = useApp();
  const [expandedWhy, setExpandedWhy] = useState(false);
  const [showTimePick, setShowTimePick] = useState(false);
  const [timeValue, setTimeValue] = useState(() => {
    if (reminder?.reminderTime) {
      const d = new Date(reminder.reminderTime);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '09:00';
  });
  const [pop, setPop] = useState(false);

  const done = todo.status === 'done';

  const whyBlock = useMemo(() => {
    if (todo.source !== 'ai') return null;
    return (
      <button
        type="button"
        className="mt-2 w-full text-left"
        onClick={() => setExpandedWhy((v) => !v)}
      >
        <p className="text-[12px] italic text-[#8c9196]">
          Suggested from your {formatShortCheckInDate(todo.sourceSessionDate)} check-in
        </p>
      </button>
    );
  }, [todo.source, todo.sourceSessionDate]);

  const onToggleDone = () => {
    if (done) return;
    setPop(true);
    window.setTimeout(() => setPop(false), 200);
    dispatch({ type: 'COMPLETE_TODO', id: todo.id });
  };

  const saveNewReminderTime = () => {
    if (!reminder?.id) return;
    const next = buildNextOccurrenceDateFromTimeString(timeValue);
    dispatch({
      type: 'UPDATE_REMINDER_TIME',
      id: reminder.id,
      reminderTime: next,
    });
    setShowTimePick(false);
  };

  const reminderLine =
    !done && todo.reminderId && reminder?.reminderTime ? (
      <div>
        <button
          type="button"
          className="mt-2 flex items-center gap-1 text-left text-[12px] text-[#6d7175]"
          onClick={() => setShowTimePick((s) => !s)}
        >
          <span aria-hidden>🔔</span>
          <span>{formatFriendlyReminderLabel(reminder.reminderTime)}</span>
        </button>
        {showTimePick && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[8px] border border-briefly-border bg-briefly-surface p-2 text-sm">
            <input
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="rounded-card border border-briefly-border px-2 py-1"
            />
            <button
              type="button"
              className="rounded-card bg-briefly-green px-3 py-1 text-xs font-semibold text-white"
              onClick={saveNewReminderTime}
            >
              Save
            </button>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className="rounded-[8px] border border-briefly-border bg-white p-4" style={{ padding: '14px 16px' }}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={`relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-transform ${
            pop ? 'briefly-todo-check-pop scale-110' : 'scale-100'
          }`}
          style={{
            borderColor: '#e1e3e5',
            backgroundColor: done ? '#008060' : 'white',
          }}
          aria-label={done ? 'Completed' : 'Mark complete'}
          onClick={onToggleDone}
        >
          {done ? (
            <span className="text-[11px] font-bold leading-none text-white">✓</span>
          ) : null}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-medium leading-snug text-briefly-text ${
                done ? 'text-[#8c9196] line-through' : ''
              }`}
              style={{ fontWeight: 500 }}
            >
              {todo.title}
            </p>
            {todo.source === 'ai' && !done && (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: '#fff5ea', color: '#b98900' }}
              >
                AI
              </span>
            )}
          </div>
          {!done && whyBlock}
          {!done && expandedWhy && todo.source === 'ai' && todo.sourceInsight ? (
            <div
              className="mt-2 rounded-[8px] bg-[#f6f6f7] p-3"
              style={{ marginTop: '8px', padding: '10px 12px' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-briefly-muted">WHY THIS MATTERS</p>
              <p className="mt-1 text-[13px] italic text-[#6d7175]">{todo.sourceInsight}</p>
            </div>
          ) : null}
          {!done && reminderLine}
        </div>
      </div>
    </div>
  );
}
