import {
  ClipboardList,
  CreditCard,
  type LucideIcon,
  ReceiptText,
  ScrollText,
  Store,
  Users,
  Wallet,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
  match: (pathname: string) => boolean;
}

const startsWith = (prefix: string) => (pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const NAV_ITEMS: NavItem[] = [
  {
    label: "대시보드",
    href: "/",
    icon: ClipboardList,
    section: "현황",
    match: (pathname) => pathname === "/",
  },
  {
    label: "부스 승인",
    href: "/booths",
    icon: Store,
    section: "운영",
    match: startsWith("/booths"),
  },
  {
    label: "주문",
    href: "/orders",
    icon: ReceiptText,
    section: "운영",
    match: startsWith("/orders"),
  },
  {
    label: "환급",
    href: "/payouts",
    icon: Wallet,
    section: "환급·돈",
    match: startsWith("/payouts"),
  },
  {
    label: "충전",
    href: "/money",
    icon: CreditCard,
    section: "환급·돈",
    match: startsWith("/money"),
  },
  {
    label: "사용자",
    href: "/users",
    icon: Users,
    section: "환급·돈",
    match: startsWith("/users"),
  },
  {
    label: "감사 로그",
    href: "/audit",
    icon: ScrollText,
    section: "감사",
    match: startsWith("/audit"),
  },
];

export const NAV_SECTIONS = [...new Set(NAV_ITEMS.map((item) => item.section))];
