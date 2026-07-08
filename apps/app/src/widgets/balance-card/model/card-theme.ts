export type CardTextColor = "light" | "dark";

export interface CardTheme {
  id: string;
  image: string;
  textColor: CardTextColor;
}

const CARD_IMAGE_BASE = "cards";

export const defaultCardTheme: CardTheme = {
  id: "default",
  image: "1.png",
  textColor: "light",
};

export function cardImageUrl(theme: CardTheme): string {
  return `${import.meta.env.BASE_URL}${CARD_IMAGE_BASE}/${theme.image}`;
}
