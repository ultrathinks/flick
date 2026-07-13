import { BrandMark } from "@flick/ui";

type BrandHeaderProps = {
  onLogoClick?: () => void;
  right?: React.ReactNode;
};

export function BrandHeader({ onLogoClick, right }: BrandHeaderProps) {
  const brand = (
    <>
      <BrandMark className="size-11" />
      <span className="text-title font-bold tracking-tight text-foreground">
        Flick
      </span>
    </>
  );

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      {onLogoClick ? (
        <button
          type="button"
          className="flex items-center gap-3 rounded-control text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand/40"
          onClick={onLogoClick}
        >
          {brand}
        </button>
      ) : (
        <div className="flex items-center gap-3">{brand}</div>
      )}
      {right}
    </header>
  );
}
