import { Loader } from "@flick/ui";

type LoadingProps = {
  label: string;
};

export function Loading({ label }: LoadingProps) {
  return (
    <div className="flex min-h-[60dvh] flex-1 flex-col items-center justify-center gap-4">
      <Loader size="lg" />
      <p className="text-subtitle font-semibold text-foreground-subtle">
        {label}
      </p>
    </div>
  );
}
