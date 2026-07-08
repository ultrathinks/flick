import { cn } from "../lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "size-7 text-caption",
  md: "size-9 text-body",
  lg: "size-14 text-heading",
};

function initial(name: string): string {
  return name.trim().slice(0, 1) || "?";
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-subtle font-bold text-brand",
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initial(name)
      )}
    </span>
  );
}
