import { useEffect, useState } from 'react';

const LINES = [
  'Reading between the lines...',
  'Finding what matters...',
  'Putting it together...',
];

export function ThinkingAnimation() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % LINES.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div
        className="briefly-pulse-circle h-24 w-24 rounded-full bg-briefly-greenBg ring-1 ring-briefly-border"
        style={{ opacity: 0.9 }}
      />
      <div className="relative mt-10 h-8 w-full max-w-sm text-center">
        {LINES.map((line, i) => (
          <p
            key={line}
            className={`absolute inset-x-0 text-sm text-briefly-muted transition-opacity duration-500 ${
              idx === i ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
