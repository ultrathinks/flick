export type CardTextColor = "light" | "dark";

export interface CardTheme {
  id: string;
  label: string;
  background: string;
  image: string;
  textColor: CardTextColor;
}
