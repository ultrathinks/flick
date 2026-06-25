export const Spinner = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-block size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 ${className}`}
    role="status"
    aria-label="로딩 중"
  />
);
