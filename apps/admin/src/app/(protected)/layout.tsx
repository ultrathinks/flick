import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/shared/auth/me";
import { AppShell } from "@/widgets/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const user = await getCurrentUser(cookieStore);

  if (!user) {
    redirect("/login");
  }
  if (!user.isAdmin) {
    redirect("/login?error=forbidden");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
