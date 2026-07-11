export type CardTextColor = "light" | "dark";

export type CardWatermarkVariant =
  | "deboss-dark"
  | "emboss-light"
  | "soft-pastel";

export interface CardWatermark {
  variant: CardWatermarkVariant;
  text?: string;
}

export interface CardTheme {
  id: string;
  label: string;
  background: string;
  image: string;
  textColor: CardTextColor;
  watermark?: CardWatermark;
}
