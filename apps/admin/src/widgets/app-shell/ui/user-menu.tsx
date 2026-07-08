"use client";

import { LogOut } from "lucide-react";
import type { Me } from "@/shared/auth/me";
import { Avatar, Menu, MenuItem } from "@/shared/ui";

export function UserMenu({ user }: { user: Me }) {
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/api/auth/login";
  };

  return (
    <Menu
      trigger={({ toggle, triggerProps }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="내 계정"
          className="flex items-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand/40"
          {...triggerProps}
        >
          <Avatar name={user.name} src={user.profileImageUrl} size="md" />
        </button>
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Avatar name={user.name} src={user.profileImageUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-foreground">
            {user.name}
          </p>
          {user.studentNumber && (
            <p className="truncate text-caption text-foreground-subtle">
              {user.studentNumber}
            </p>
          )}
        </div>
      </div>
      <div className="my-1 h-px bg-border" />
      <MenuItem tone="danger" icon={<LogOut />} onClick={logout}>
        로그아웃
      </MenuItem>
    </Menu>
  );
}
