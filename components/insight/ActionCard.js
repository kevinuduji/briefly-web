import { Card } from '../ui/Card';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';
import { ReminderCard } from './ReminderCard';

export function ActionCard({ insight, disabled, onIllDo, onMarkComplete, reminderLabel, showReminderCard }) {
  return (
    <Card className="border-l-[3px] border-l-briefly-green p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Do this next</p>
      <p className="mt-2 text-base font-semibold text-briefly-text">{insight.action.title}</p>
      <p className="mt-2 text-sm text-briefly-muted">{insight.action.how}</p>
      <p className="mt-3 inline-flex rounded-full bg-briefly-greenBg px-3 py-1 text-xs font-semibold text-briefly-green">
        {insight.action.deadlineLabel}
      </p>
      {showReminderCard && reminderLabel ? (
        <div className="mt-4">
          <ReminderCard actionTitle={insight.action.title} reminderLabel={reminderLabel} />
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <PrimaryButton className="w-full sm:flex-1" disabled={disabled} onClick={() => onIllDo?.()}>
          ✓ I&apos;ll do this
        </PrimaryButton>
        <SecondaryButton className="w-full sm:flex-1" disabled={disabled} onClick={() => onMarkComplete?.()}>
          I already did this
        </SecondaryButton>
      </div>
    </Card>
  );
}
