import { useState } from "react";
import { cardImageUrl } from "../model/themes.ts";
import type {
  CardTheme,
  CardWatermark,
  CardWatermarkVariant,
} from "../model/types.ts";

interface CardFaceProps {
  theme: CardTheme;
}

const wordmarkColorClass: Record<CardWatermarkVariant, string> = {
  "deboss-dark": "text-white/[0.16]",
  "emboss-light": "text-white/[0.32]",
  "soft-pastel": "text-black/[0.16]",
};

const wordmarkShadowClass: Record<CardWatermarkVariant, string> = {
  "deboss-dark":
    "[text-shadow:0_1px_0_rgb(255_255_255/0.14),0_-1px_1px_rgb(0_0_0/0.7)]",
  "emboss-light":
    "[text-shadow:0_-1px_1px_rgb(0_0_0/0.5),0_1px_1px_rgb(255_255_255/0.24)]",
  "soft-pastel":
    "[text-shadow:0_1px_1px_rgb(255_255_255/0.6),0_-1px_1px_rgb(0_0_0/0.12)]",
};

const wordmarkBlendClass: Record<CardWatermarkVariant, string> = {
  "deboss-dark": "mix-blend-normal",
  "emboss-light": "mix-blend-normal",
  "soft-pastel": "mix-blend-multiply",
};

function resolveWatermark(theme: CardTheme): Required<CardWatermark> {
  const variant: CardWatermarkVariant =
    theme.watermark?.variant ??
    (theme.textColor === "light" ? "emboss-light" : "soft-pastel");
  return { variant, text: theme.watermark?.text ?? "Flick" };
}

export const CardFace = ({ theme }: CardFaceProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const watermark = resolveWatermark(theme);
  const watermarkColor = wordmarkColorClass[watermark.variant];
  const watermarkShadow = wordmarkShadowClass[watermark.variant];
  const watermarkBlend = wordmarkBlendClass[watermark.variant];

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{ background: theme.background }}
      />
      {!imageFailed && (
        <img
          src={cardImageUrl(theme)}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}

      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgb(255_255_255/0.22),transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.1)_47%,rgb(255_255_255/0.02)_52%,transparent_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgb(0_0_0/0.32),transparent_42%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgb(255_255_255/0.18),inset_0_0_0_1px_rgb(255_255_255/0.06),inset_0_-1px_2px_rgb(0_0_0/0.35)]"
      />

      <span
        className={`absolute bottom-6 right-6 select-none text-title font-extrabold tracking-tight ${watermarkBlend} ${watermarkColor} ${watermarkShadow}`}
      >
        {watermark.text}
      </span>
    </div>
  );
};
