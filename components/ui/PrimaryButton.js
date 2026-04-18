export function PrimaryButton({ children, className = '', disabled, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-card bg-briefly-green px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
