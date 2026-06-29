"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/shared/ui";

export function LogoutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/api/auth/login";
      }}
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">로그아웃</span>
    </Button>
  );
}
