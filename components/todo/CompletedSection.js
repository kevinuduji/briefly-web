import { useMemo, useState } from 'react';
import { TodoItem } from './TodoItem';

function formatCompletedAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * @param {{ items: object[], remindersById: Map<string, object> }} props
 */
export function CompletedSection({ items, remindersById }) {
  const [open, setOpen] = useState(false);
  const count = items.length;

  const rows = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  }, [items]);

  if (count === 0) {
    return (
      <div className="pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted" style={{ letterSpacing: '0.04em' }}>
          COMPLETED
        </p>
        <p className="mt-2 text-[13px] text-briefly-muted">Nothing completed yet. Check something off — you’ll see it here.</p>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted" style={{ letterSpacing: '0.04em' }}>
          COMPLETED
        </p>
        <button
          type="button"
          className="text-left text-[13px] text-briefly-muted underline-offset-4 hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide completed ↑' : `Show ${count} completed →`}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          {rows.map((todo) => (
            <div key={todo.id}>
              <TodoItem todo={todo} reminder={todo.reminderId ? remindersById.get(todo.reminderId) ?? null : null} />
              <p className="mt-1 px-1 text-xs text-briefly-muted">Completed {formatCompletedAt(todo.completedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
