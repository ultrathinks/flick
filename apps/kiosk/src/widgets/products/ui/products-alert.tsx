import { TriangleAlert } from "lucide-react";

type ProductsAlertProps = {
  message: string;
};

export function ProductsAlert({ message }: ProductsAlertProps) {
  return (
    <div className="fixed left-0 right-0 top-24 z-50 flex justify-center">
      <div className="flex max-w-md items-center rounded-card border border-border bg-surface px-5 py-4 shadow-[var(--shadow-overlay)]">
        <TriangleAlert className="size-6 text-danger" strokeWidth={2} />
        <span className="ml-3 text-heading font-medium text-foreground">
          {message}
        </span>
      </div>
    </div>
  );
}
