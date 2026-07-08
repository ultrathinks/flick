import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionState } from "@/shared/auth/me";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionState();

  if (session === "expired") {
    const requestHeaders = await headers();
    const pathname = requestHeaders.get("x-pathname") ?? "/";
    redirect(`/api/auth/refresh?next=${encodeURIComponent(pathname)}`);
  }
  if (session === "unauthenticated") {
    redirect("/login");
  }

  return <>{children}</>;
}
