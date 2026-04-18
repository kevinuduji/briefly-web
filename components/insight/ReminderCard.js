import { useState } from 'react';

export function ReminderCard({ actionTitle, reminderLabel }) {
  const [teaserOpen, setTeaserOpen] = useState(false);

  return (
    <div
      className="w-full rounded-[8px] border bg-white text-left"
      style={{ borderColor: '#e1e3e5', padding: '12px 16px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-base leading-none" style={{ fontSize: '16px' }}>
            🔔
          </span>
          <span className="text-[13px] font-semibold text-[#202223]">Reminder set</span>
        </div>
        <span className="shrink-0 text-[13px] text-[#6d7175]">{reminderLabel}</span>
      </div>
      <p className="mt-1 text-[12px] italic text-[#6d7175]">&ldquo;{actionTitle}&rdquo;</p>

      <div className="my-2.5" style={{ height: 1, backgroundColor: '#f6f6f7' }} />

      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setTeaserOpen((v) => !v)}
      >
        <span className="shrink-0 text-[10px] leading-none text-[#c9cccf]" aria-hidden>
          ○
        </span>
        <span className="text-[12px] font-normal text-[#0070f3]">Connect Google Calendar to sync →</span>
      </button>

      {teaserOpen && (
        <div
          className="briefly-teaser-fade-in mt-2 rounded-[8px] border text-[13px] italic text-[#6d7175]"
          style={{ borderColor: '#e1e3e5', padding: '10px 12px' }}
        >
          Google Calendar sync is coming soon. For now, your reminders live inside MyHustle.
        </div>
      )}
    </div>
  );
}
