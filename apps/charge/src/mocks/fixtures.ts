import type { Session } from "@/entities/session";
import type { Me } from "@/entities/user";
import type { ResolvedUser } from "@/features/charge";

export const session: Session = {
  accessToken: "mock-access",
  refreshToken: "mock-refresh",
  expiresIn: 3600,
};

export const me: Me = {
  id: "admin-1",
  username: "operator",
  name: "김운영",
  profileImageUrl: null,
  roles: ["ADMIN"],
  isAdmin: true,
  studentNumber: null,
  balance: 0,
};

export const resolvedUser: ResolvedUser = {
  userId: "user-1",
  name: "김플릭",
  roles: ["STUDENT"],
  studentNumber: "2101",
  balance: 128000,
};

export function chargeTransaction(amount: number) {
  return {
    id: `charge-${Date.now()}`,
    userId: resolvedUser.userId,
    amount,
    type: "charge",
    createdAt: new Date().toISOString(),
  };
}
