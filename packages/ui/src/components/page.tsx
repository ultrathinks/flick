import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { PageHeader } from "./page-header";

export function Page({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
