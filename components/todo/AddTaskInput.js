import { useMemo, useState } from 'react';

function buildReminderDateFromChoice(choice, customTime) {
  const now = new Date();
  if (choice === 'morning') {
    const d = new Date(now);
    d.setHours(9, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }
  if (choice === 'afternoon') {
    const d = new Date(now);
    d.setHours(14, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }
  if (choice === 'evening') {
    const d = new Date(now);
    d.setHours(20, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d;
  }
  if (choice === 'custom' && customTime) {
    const [h, m] = customTime.split(':').map((x) => Number(x));
    if (Number.isFinite(h) && Number.isFinite(m)) {
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      if (d <= now) d.setDate(d.getDate() + 1);
      return d;
    }
  }
  const d = new Date(now);
  d.setHours(9, 0, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * @param {{ zone: 'this-week' | 'someday', hustleName: string, hustleId: string, onSubmit: (payload: { title: string, zone: string, reminderChoice: string | null, customTime: string | null }) => void }} props
 */
export function AddTaskInput({ zone, hustleName, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [remindOn, setRemindOn] = useState(false);
  const [reminderChoice, setReminderChoice] = useState('morning');
  const [customTime, setCustomTime] = useState('09:00');

  const placeholder = useMemo(
    () => `What do you need to do for ${hustleName || 'this hustle'}?`,
    [hustleName]
  );

  const handleAdd = () => {
    const title = text.trim();
    if (!title) return;
    onSubmit({
      title,
      zone,
      reminderChoice: remindOn ? reminderChoice : null,
      customTime: remindOn && reminderChoice === 'custom' ? customTime : null,
    });
    setText('');
    setRemindOn(false);
    setReminderChoice('morning');
    setCustomTime('09:00');
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="pt-2">
        <button
          type="button"
          className="text-[13px] text-briefly-placeholder transition-colors hover:text-briefly-text"
          onClick={() => setOpen(true)}
        >
          + Add a task
        </button>
      </div>
    );
  }

  return (
    <div className="briefly-fade-in-up space-y-3 pt-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b bg-transparent py-2 text-sm text-briefly-text outline-none"
        style={{ borderColor: '#e1e3e5' }}
        autoFocus
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-briefly-muted">
          <input
            type="checkbox"
            checked={remindOn}
            onChange={(e) => setRemindOn(e.target.checked)}
            className="accent-briefly-green"
          />
          Set reminder
        </label>
        <button
          type="button"
          className="text-sm font-semibold text-briefly-green"
          onClick={handleAdd}
        >
          Add →
        </button>
      </div>
      {remindOn && (
        <div className="flex flex-wrap gap-2 text-[13px] text-briefly-text">
          {['morning', 'afternoon', 'evening', 'custom'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setReminderChoice(k)}
              className={`rounded-full border px-2.5 py-1 capitalize ${
                reminderChoice === k ? 'border-briefly-green bg-briefly-greenBg text-briefly-green' : 'border-briefly-border'
              }`}
            >
              {k === 'morning' ? 'Morning (9 AM)' : null}
              {k === 'afternoon' ? 'Afternoon (2 PM)' : null}
              {k === 'evening' ? 'Evening (8 PM)' : null}
              {k === 'custom' ? 'Custom' : null}
            </button>
          ))}
          {reminderChoice === 'custom' && (
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="rounded-card border border-briefly-border px-2 py-1 text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

export { buildReminderDateFromChoice };
