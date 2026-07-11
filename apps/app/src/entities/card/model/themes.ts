import type { CardTheme } from "./types.ts";

const CARD_IMAGE_BASE = "cards";

export const CARD_THEMES: [CardTheme, ...CardTheme[]] = [
  {
    id: "black",
    label: "블랙",
    background:
      "linear-gradient(135deg, #3a3a3a 0%, #202020 55%, #131313 100%)",
    image: "1.png",
    textColor: "light",
    watermark: { variant: "deboss-dark" },
  },
  {
    id: "titan",
    label: "티타늄",
    background:
      "linear-gradient(135deg, #4a515a 0%, #363b42 55%, #24272d 100%)",
    image: "2.png",
    textColor: "light",
    watermark: { variant: "emboss-light" },
  },
  {
    id: "teddy",
    label: "테디",
    background:
      "linear-gradient(135deg, #fce3c4 0%, #f8d4a8 55%, #f2c489 100%)",
    image: "3.png",
    textColor: "dark",
    watermark: { variant: "soft-pastel" },
  },
];

export const defaultCardTheme: CardTheme = CARD_THEMES[0];

export function getCardTheme(id: string | null | undefined): CardTheme {
  if (!id) {
    return defaultCardTheme;
  }
  return CARD_THEMES.find((theme) => theme.id === id) ?? defaultCardTheme;
}

export function cardImageUrl(theme: CardTheme): string {
  return `${import.meta.env.BASE_URL}${CARD_IMAGE_BASE}/${theme.image}`;
}
