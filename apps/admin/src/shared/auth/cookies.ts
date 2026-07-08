export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const isProduction = process.env.NODE_ENV === "production";

function cookieName(key: string): string {
  const name = `flick_admin_${key}`;
  return isProduction ? `__Host-${name}` : name;
}

export const ACCESS_COOKIE = cookieName("access");
export const REFRESH_COOKIE = cookieName("refresh");
export const VERIFIER_COOKIE = cookieName("verifier");
export const STATE_COOKIE = cookieName("state");

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: isProduction,
} as const;
