import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-blue-600 text-white active:bg-blue-700 disabled:bg-blue-300",
  secondary:
    "bg-zinc-100 text-zinc-900 active:bg-zinc-200 disabled:text-zinc-400",
  ghost:
    "bg-transparent text-blue-600 active:bg-blue-50 disabled:text-zinc-300",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export const Button = ({
  variant = "primary",
  fullWidth = true,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`h-[52px] rounded-2xl px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed ${
      fullWidth ? "w-full" : ""
    } ${variants[variant]} ${className}`}
    {...props}
  />
);
