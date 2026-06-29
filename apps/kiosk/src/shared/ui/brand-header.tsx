import Image from "next/image";

type BrandHeaderProps = {
  onLogoClick?: () => void;
  right?: React.ReactNode;
};

export function BrandHeader({ onLogoClick, right }: BrandHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6">
      <button
        type="button"
        className="flex items-center gap-3 text-left"
        onClick={onLogoClick}
      >
        <Image
          src="/assets/images/logo.png"
          alt="Flick"
          width={40}
          height={40}
          className="h-10 w-10"
        />
        <h1 className="text-xl font-bold text-slate-900">
          <span className="text-indigo-600">Flick</span> Place
        </h1>
      </button>
      {right}
    </header>
  );
}
