import Image from "next/image";

type BrandHeaderProps = {
  onLogoClick?: () => void;
  right?: React.ReactNode;
};

export function BrandHeader({ onLogoClick, right }: BrandHeaderProps) {
  const logo = (
    <>
      <Image
        src="/assets/images/logo.png"
        alt="Flick"
        width={40}
        height={40}
        className="h-10 w-10"
      />
      <h1 className="text-title font-bold text-foreground">
        <span className="text-brand">Flick</span> Place
      </h1>
    </>
  );

  return (
    <header className="flex h-20 items-center justify-between border-b border-border bg-surface px-6">
      {onLogoClick ? (
        <button
          type="button"
          className="flex items-center gap-3 rounded-control text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand/40"
          onClick={onLogoClick}
        >
          {logo}
        </button>
      ) : (
        <div className="flex items-center gap-3">{logo}</div>
      )}
      {right}
    </header>
  );
}
