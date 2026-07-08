"use client";

import { LogOut } from "lucide-react";
import type { Booth } from "@/entities/booth";
import { Avatar, Menu, MenuItem } from "@/shared/ui";
import { BoothBadge } from "./booth-badge.tsx";

export function BoothMenu({ booth }: { booth: Booth }) {
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/api/auth/login";
  };

  return (
    <Menu
      trigger={({ toggle, ...aria }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="부스 메뉴"
          className="flex items-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand/40"
          {...aria}
        >
          <Avatar name={booth.name} size="md" />
        </button>
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Avatar name={booth.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-foreground">
            {booth.name}
          </p>
          <div className="mt-1">
            <BoothBadge status={booth.status} />
          </div>
        </div>
      </div>
      <div className="my-1 h-px bg-border" />
      <MenuItem tone="danger" icon={<LogOut />} onClick={logout}>
        로그아웃
      </MenuItem>
    </Menu>
  );
}
