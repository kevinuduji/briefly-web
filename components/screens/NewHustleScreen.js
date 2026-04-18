import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SecondaryButton } from '../ui/SecondaryButton';

const GOALS = [
  { emoji: '💰', label: 'Make more money', value: 'revenue' },
  { emoji: '📣', label: 'Get more customers', value: 'customers' },
  { emoji: '🧠', label: 'Understand what works', value: 'clarity' },
  { emoji: '😌', label: 'Feel more in control', value: 'control' },
];

const EMOJI_OPTIONS = ['📸', '🛍️', '🎨', '🎵', '💻', '🌿', '👗', '🍕', '📦', '✂️', '🏋️', '🎓'];

export function NewHustleScreen() {
  const { addHustle, navigate } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📸');
  const [businessType, setBusinessType] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState(null);

  const ready = useMemo(
    () => name.trim() && businessType.trim() && primaryGoal,
    [name, businessType, primaryGoal]
  );

  const onSubmit = () => {
    if (!ready) return;
    addHustle({
      name: name.trim(),
      emoji,
      businessType: businessType.trim(),
      primaryGoal,
    });
    navigate('home');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <SecondaryButton className="py-2 text-sm" onClick={() => navigate('portfolio')}>
          ← Back
        </SecondaryButton>
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-briefly-text">Add a hustle</h1>
      <p className="mt-2 text-sm text-briefly-muted">
        Same quick setup as your first one. You can switch between hustles anytime from the portfolio.
      </p>

      <label className="mt-8 block text-sm font-semibold text-briefly-text">What do you call this hustle?</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Portrait Photography, Vintage Resale, Campus Tutoring..."
        className="mt-2 w-full rounded-card border border-briefly-border bg-briefly-surface px-3 py-3 text-sm text-briefly-text placeholder:text-briefly-placeholder"
      />

      <p className="mt-8 text-sm font-semibold text-briefly-text">Pick an emoji for it.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {EMOJI_OPTIONS.map((em) => {
          const selected = emoji === em;
          return (
            <button
              key={em}
              type="button"
              aria-label={`emoji ${em}`}
              onClick={() => setEmoji(em)}
              className={`flex h-12 w-12 items-center justify-center rounded-card border-2 text-2xl transition-colors ${
                selected ? 'border-briefly-green bg-briefly-greenBg' : 'border-briefly-border bg-briefly-surface'
              }`}
            >
              {em}
            </button>
          );
        })}
      </div>

      <label className="mt-8 block text-sm font-semibold text-briefly-text">What kind of work is it?</label>
      <input
        value={businessType}
        onChange={(e) => setBusinessType(e.target.value)}
        placeholder="e.g. photography, clothing resale, tutoring, design..."
        className="mt-2 w-full rounded-card border border-briefly-border bg-briefly-surface px-3 py-3 text-sm text-briefly-text placeholder:text-briefly-placeholder"
      />

      <p className="mt-8 text-sm font-semibold text-briefly-text">What do you most want from this hustle right now?</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {GOALS.map((g) => {
          const selected = primaryGoal === g.value;
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => setPrimaryGoal(g.value)}
              className={`rounded-card border p-3 text-left text-sm font-semibold transition-colors ${
                selected
                  ? 'border-briefly-green bg-briefly-greenBg text-briefly-text'
                  : 'border-briefly-border bg-briefly-surface text-briefly-text hover:bg-briefly-page'
              }`}
            >
              <span className="mr-1">{g.emoji}</span>
              {g.label}
            </button>
          );
        })}
      </div>

      <PrimaryButton className="mt-10 w-full" disabled={!ready} onClick={onSubmit}>
        Start this hustle →
      </PrimaryButton>
    </div>
  );
}
