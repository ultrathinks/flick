import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionState } from "@/shared/auth/me";
import { AppShell } from "@/widgets/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionState();

  if (session.status === "expired") {
    const requestHeaders = await headers();
    const pathname = requestHeaders.get("x-pathname") ?? "/";
    redirect(`/api/auth/refresh?next=${encodeURIComponent(pathname)}`);
  }
  if (session.status === "unauthenticated") {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    redirect("/login?error=forbidden");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
