import type { CardTheme } from "./types.ts";

const CARD_IMAGE_BASE = "cards";

export const CARD_THEMES: [CardTheme, ...CardTheme[]] = [
  {
    id: "midnight",
    label: "미드나이트",
    background:
      "linear-gradient(135deg, #23252c 0%, #14151a 55%, #0d0e12 100%)",
    image: "1.png",
    textColor: "light",
  },
  {
    id: "ocean",
    label: "오션",
    background:
      "linear-gradient(135deg, #2b6cff 0%, #1b3fb0 55%, #101c4d 100%)",
    image: "2.png",
    textColor: "light",
  },
  {
    id: "forest",
    label: "포레스트",
    background:
      "linear-gradient(135deg, #2fbf71 0%, #1a8f52 55%, #0d4d2c 100%)",
    image: "3.png",
    textColor: "light",
  },
  {
    id: "sunset",
    label: "선셋",
    background:
      "linear-gradient(135deg, #ff8a5c 0%, #ff5e62 55%, #b02e63 100%)",
    image: "4.png",
    textColor: "light",
  },
  {
    id: "grape",
    label: "그레이프",
    background:
      "linear-gradient(135deg, #8a5cff 0%, #6a3fd6 55%, #3a1f8f 100%)",
    image: "5.png",
    textColor: "light",
  },
  {
    id: "ivory",
    label: "아이보리",
    background:
      "linear-gradient(135deg, #f5f1e8 0%, #e6ddc9 55%, #cdbfa0 100%)",
    image: "6.png",
    textColor: "dark",
  },
  {
    id: "rose",
    label: "로즈골드",
    background:
      "linear-gradient(135deg, #f7c9c0 0%, #e79a94 55%, #c76b6b 100%)",
    image: "7.png",
    textColor: "dark",
  },
  {
    id: "graphite",
    label: "그래파이트",
    background:
      "linear-gradient(135deg, #6b7280 0%, #4b5159 55%, #2a2e34 100%)",
    image: "8.png",
    textColor: "light",
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
