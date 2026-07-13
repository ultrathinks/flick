import { cn } from "../lib/cn";

type BrandMarkProps = {
  className?: string;
  src?: string;
  alt?: string;
};

export function BrandMark({
  className,
  src = "/brand-mark.png",
  alt = "Flick",
}: BrandMarkProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("block object-contain", className)}
      draggable={false}
    />
  );
}
