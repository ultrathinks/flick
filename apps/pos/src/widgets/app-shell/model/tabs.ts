import {
  type LucideIcon,
  Monitor,
  Receipt,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import type { Booth } from "@/entities/booth";

export type TabKey = "menu" | "orders" | "kiosks" | "settings";

export interface TabDef {
  key: TabKey;
  label: string;
  shortLabel: string;
  href: string;
  icon: LucideIcon;
  section: string;
}

export const TABS: TabDef[] = [
  {
    key: "menu",
    label: "메뉴 관리",
    shortLabel: "메뉴",
    href: "/",
    icon: UtensilsCrossed,
    section: "운영",
  },
  {
    key: "orders",
    label: "주문 · 매출",
    shortLabel: "주문",
    href: "/orders",
    icon: Receipt,
    section: "운영",
  },
  {
    key: "kiosks",
    label: "키오스크",
    shortLabel: "키오스크",
    href: "/kiosks",
    icon: Monitor,
    section: "운영",
  },
  {
    key: "settings",
    label: "부스 설정",
    shortLabel: "설정",
    href: "/settings/booth",
    icon: Settings,
    section: "관리",
  },
];

export function isTabLocked(tab: TabKey, status: Booth["status"]): boolean {
  if (tab === "kiosks") {
    return status !== "approved";
  }
  return false;
}
