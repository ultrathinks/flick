import { useState } from "react";
import { type CardTheme, cardImageUrl } from "../model/card-theme.ts";

interface CardFaceProps {
  theme: CardTheme;
}

const textColorClass: Record<CardTheme["textColor"], string> = {
  light: "text-white",
  dark: "text-[#191f28]",
};

export const CardFace = ({ theme }: CardFaceProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#23252c] via-[#14151a] to-[#0d0e12]" />
      {!imageFailed && (
        <img
          src={cardImageUrl(theme)}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
      <span
        className={`absolute left-6 top-6 text-title font-extrabold tracking-tight ${textColorClass[theme.textColor]}`}
      >
        Flick
      </span>
    </div>
  );
};
