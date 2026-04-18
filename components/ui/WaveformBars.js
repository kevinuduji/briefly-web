export function WaveformBars({ className = '' }) {
  return (
    <div className={`flex h-10 items-end justify-center gap-1 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="briefly-wave-bar w-1.5 rounded-full bg-briefly-green"
          style={{ animationDelay: `${i * 120}ms`, height: '100%' }}
        />
      ))}
    </div>
  );
}
