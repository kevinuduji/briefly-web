import { useState } from 'react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { WaveformBars } from '../ui/WaveformBars';

export function VoiceRecorder({
  onCommit,
  onRecordingStart,
  showWaveform,
  disabled,
  instruction = 'Tap to speak. Tap again to stop.',
}) {
  const { speechSupported, isRecording, line, error, start, commitAndStop } = useSpeechRecognition();
  const [typedOpen, setTypedOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const toggle = () => {
    if (disabled) return;
    if (typedOpen) return;
    if (!speechSupported) {
      setTypedOpen(true);
      return;
    }
    if (!isRecording) {
      onRecordingStart?.();
      start();
      return;
    }
    const text = commitAndStop();
    onCommit?.(text);
  };

  const submitTyped = () => {
    const text = typed.trim();
    setTyped('');
    setTypedOpen(false);
    onCommit?.(text);
  };

  return (
    <div className="mt-8 flex w-full flex-col items-center">
      {!typedOpen && (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={toggle}
            className={`flex h-[72px] w-[72px] items-center justify-center rounded-full bg-briefly-green text-white shadow-brieflyCard transition-transform active:scale-[0.98] disabled:opacity-40 ${
              isRecording ? 'briefly-record-pulse' : ''
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <span className="text-sm font-semibold">{isRecording ? 'Stop' : 'Rec'}</span>
          </button>
          {showWaveform && isRecording && (
            <div className="mt-6 w-full max-w-xs">
              <WaveformBars />
            </div>
          )}
          {isRecording && (
            <p className="mt-4 max-w-sm text-center text-sm text-briefly-muted">{line || 'Listening…'}</p>
          )}
          <p className="mt-4 text-center text-xs text-briefly-muted">{instruction}</p>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-briefly-green underline-offset-4 hover:underline"
            onClick={() => setTypedOpen(true)}
          >
            Type instead →
          </button>
        </>
      )}
      {typedOpen && (
        <div className="w-full max-w-md">
          <textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            rows={4}
            placeholder="Say it in your own words — even one sentence is enough."
            className="w-full rounded-card border border-briefly-border bg-briefly-surface p-3 text-sm text-briefly-text placeholder:text-briefly-placeholder"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submitTyped}
              className="rounded-card bg-briefly-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              disabled={!typed.trim() || disabled}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => {
                setTypedOpen(false);
                setTyped('');
              }}
              className="rounded-card border border-briefly-border bg-briefly-surface px-4 py-2 text-sm font-semibold text-briefly-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-center text-xs text-briefly-red">{error}</p>}
    </div>
  );
}
