type LoadingProps = {
  label: string;
};

export function Loading({ label }: LoadingProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      <p className="mt-4 text-base font-semibold text-slate-500">{label}</p>
    </div>
  );
}
