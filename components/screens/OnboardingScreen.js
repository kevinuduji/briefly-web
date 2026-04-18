import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PrimaryButton } from '../ui/PrimaryButton';
import { WaveformBars } from '../ui/WaveformBars';
import { Card } from '../ui/Card';

const GOALS = [
  { emoji: '💰', label: 'Make more money', value: 'revenue' },
  { emoji: '📣', label: 'Get more customers', value: 'customers' },
  { emoji: '🧠', label: 'Understand what works', value: 'clarity' },
  { emoji: '😌', label: 'Feel more in control', value: 'control' },
];

const EMOJI_OPTIONS = ['📸', '🛍️', '🎨', '🎵', '💻', '🌿', '👗', '🍕', '📦', '✂️', '🏋️', '🎓'];

function ProgressDots({ step }) {
  return (
    <div className="flex justify-center gap-2 pt-2">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i <= step ? 'bg-briefly-amber' : 'bg-briefly-borderStrong'}`}
        />
      ))}
    </div>
  );
}

function Step4Demo({ onStart }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setBeat(1), 1800);
    const t2 = setTimeout(() => setBeat(2), 3200);
    const t3 = setTimeout(() => setBeat(3), 4400);
    const t4 = setTimeout(() => setBeat(4), 5600);
    const t5 = setTimeout(() => setBeat(5), 6800);
    const t6 = setTimeout(() => setBeat(6), 9000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  const showEarly = beat < 5;

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col">
      <p className="text-center text-xs font-medium text-briefly-muted">Here is what a session looks like.</p>

      {showEarly && (
        <div className="mt-8 space-y-5">
          <Card className="p-5 transition-opacity duration-300">
            <p className="text-center text-lg font-semibold text-briefly-text">How did things go today?</p>
            {beat < 2 && (
              <div className="mt-6">
                <WaveformBars />
                <p className="mt-3 text-center text-xs text-briefly-muted">Maya, vintage resale hustle</p>
              </div>
            )}
          </Card>

          {beat >= 1 && (
            <p className="briefly-fade-in-up text-center text-sm leading-relaxed text-briefly-text">
              Pretty decent day. Sold a bunch of the linen shirts again. Still have way too many hoodies sitting there.
              Kind of tired.
            </p>
          )}

          {beat >= 2 && beat < 3 && (
            <div className="flex items-center justify-center gap-2 text-sm text-briefly-muted">
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
              MyHustle is thinking...
            </div>
          )}

          {beat >= 3 && (
            <Card className="border-l-4 border-l-briefly-amber p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">One follow-up</p>
              <p className="mt-2 text-lg font-medium leading-snug text-briefly-text">
                The hoodies keep coming up — is it a specific style or the whole category that isn&apos;t moving?
              </p>
            </Card>
          )}

          {beat >= 4 && (
            <p className="briefly-fade-in-up text-center text-sm leading-relaxed text-briefly-text">
              Pretty much all of them honestly. Wrong season maybe.
            </p>
          )}
        </div>
      )}

      {beat >= 5 && (
        <div className="mt-10 space-y-4 briefly-fade-in-up">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">
              The one thing right now
            </p>
            <p className="mt-3 text-lg font-medium leading-relaxed text-briefly-text">
              Linen shirts are clearly your strongest mover — but your hoodie inventory is quietly draining your cash
              flow. Before you order anything new, move the hoodies with a bundle deal or a markdown this week. Free up
              that shelf space for what is actually selling.
            </p>
          </div>
          <Card className="border-l-4 border-l-briefly-green p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-briefly-muted">Do this next</p>
            <p className="mt-2 text-base font-semibold text-briefly-text">Run a hoodie clearance promotion this week</p>
            <p className="mt-2 text-sm text-briefly-muted">
              How: Bundle 2 hoodies for the price of 1.5, or mark down 30%
            </p>
            <p className="mt-3 inline-flex rounded-full bg-briefly-greenBg px-3 py-1 text-xs font-semibold text-briefly-green">
              This Friday
            </p>
          </Card>
        </div>
      )}

      {beat >= 6 && (
        <div className="mt-8 space-y-4 pb-8 briefly-fade-in-up">
          <p className="text-center text-sm italic text-briefly-muted">
            This is what MyHustle does. Every day. In under three minutes.
          </p>
          <PrimaryButton className="w-full" onClick={onStart}>
            Start your first session →
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}

export function OnboardingScreen() {
  const {
    onboardingStep,
    advanceOnboarding,
    finishOnboardingToPortfolio,
    addHustle,
    startSession,
  } = useApp();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📸');
  const [businessType, setBusinessType] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState(null);

  const step2Ready = useMemo(
    () => Boolean(name?.trim()) && Boolean(businessType?.trim()) && Boolean(primaryGoal),
    [name, businessType, primaryGoal]
  );

  const submitStep2 = () => {
    if (!step2Ready) return;
    addHustle({
      name: name.trim(),
      emoji,
      businessType: businessType.trim(),
      primaryGoal,
    });
    advanceOnboarding();
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-10 pt-6">
      <ProgressDots step={onboardingStep} />

      {onboardingStep === 1 && (
        <div className="mt-16 flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-[32px] font-bold leading-tight text-briefly-text">Every hustle deserves a coach.</h1>
          <p className="mt-6 max-w-[440px] text-base leading-[1.7] text-briefly-muted">
            Whether you are shooting portraits on weekends, running a resale store, freelancing on the side, or building
            something from scratch — MyHustle learns how you operate and tells you exactly what to focus on. One check-in.
            One insight. Every day.
          </p>
          <PrimaryButton className="mt-10 w-full max-w-sm" onClick={advanceOnboarding}>
            Let&apos;s build something →
          </PrimaryButton>
        </div>
      )}

      {onboardingStep === 2 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-briefly-text">Tell us about your first hustle.</h2>
          <p className="mt-2 text-sm text-briefly-muted">
            You can add more later — most people have two or three things going on.
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
          <PrimaryButton className="mt-10 w-full" disabled={!step2Ready} onClick={submitStep2}>
            Got it →
          </PrimaryButton>
        </div>
      )}

      {onboardingStep === 3 && (
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-briefly-text">Here is how this works.</h2>
          <div className="mt-6 space-y-3">
            <Card className="briefly-fade-in-up p-4">
              <div className="flex gap-3">
                <div className="text-xl">🎙️</div>
                <div>
                  <p className="font-semibold text-briefly-text">Just talk.</p>
                  <p className="mt-1 text-sm leading-relaxed text-briefly-muted">
                    Say as much or as little as you want about your hustle. One sentence or five minutes. MyHustle figures
                    out what matters.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="briefly-fade-in-up p-4 [animation-delay:120ms]">
              <div className="flex gap-3">
                <div className="text-xl">🤔</div>
                <div>
                  <p className="font-semibold text-briefly-text">It will ask you one follow-up.</p>
                  <p className="mt-1 text-sm leading-relaxed text-briefly-muted">
                    Based on what you say, MyHustle asks one targeted question to fill in what it needs. That is the whole
                    process.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="briefly-fade-in-up p-4 [animation-delay:240ms]">
              <div className="flex gap-3">
                <div className="text-xl">✨</div>
                <div>
                  <p className="font-semibold text-briefly-text">You get one insight and one action.</p>
                  <p className="mt-1 text-sm leading-relaxed text-briefly-muted">
                    Not a dashboard. Not a list of tips. The single most useful thing for this hustle right now.
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <p className="mt-6 text-center text-xs italic text-briefly-muted">
            There is nothing to set up. No integrations. No spreadsheets. Just start talking.
          </p>
          <PrimaryButton className="mt-8 w-full" onClick={advanceOnboarding}>
            I&apos;m ready →
          </PrimaryButton>
        </div>
      )}

      {onboardingStep === 4 && (
        <Step4Demo
          onStart={() => {
            finishOnboardingToPortfolio();
            startSession();
          }}
        />
      )}
    </div>
  );
}
