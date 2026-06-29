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
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white">
          F
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          <span className="text-indigo-600">Flick</span> Place
        </h1>
      </button>
      {right}
    </header>
  );
}
