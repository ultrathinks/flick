"use client";

import { Button } from "@/shared/ui";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      className="text-xs"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/api/auth/login";
      }}
    >
      로그아웃
    </Button>
  );
}
