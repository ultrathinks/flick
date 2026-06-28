import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
  secondary: "bg-zinc-100 text-zinc-800 hover:bg-zinc-200",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
  ghost: "text-zinc-500 hover:text-zinc-800",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
