export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-card bg-briefly-surface shadow-brieflyCard border border-briefly-border ${className}`}
    >
      {children}
    </div>
  );
}
