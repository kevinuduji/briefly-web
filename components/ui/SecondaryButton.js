export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-card border border-briefly-border bg-briefly-surface px-5 py-3 text-sm font-semibold text-briefly-text transition-colors hover:bg-briefly-page ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
