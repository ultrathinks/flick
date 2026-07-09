import type { CardTheme } from "../model/types.ts";
import { CardFace } from "./card-face.tsx";

const CARD_SHADOW =
  "shadow-[0_1px_1px_rgb(0_0_0/0.12),0_8px_20px_-6px_rgb(0_0_0/0.45),0_20px_40px_-12px_rgb(0_0_0/0.5)]";

interface CardVisualProps {
  theme: CardTheme;
  className?: string;
}

export const CardVisual = ({ theme, className }: CardVisualProps) => {
  return (
    <div
      className={`relative aspect-[1.586/1] w-full overflow-hidden rounded-card ${CARD_SHADOW} ${className ?? ""}`}
    >
      <CardFace theme={theme} />
    </div>
  );
};
