export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const ACCESS_COOKIE = "flick_pos_access";
export const REFRESH_COOKIE = "flick_pos_refresh";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;
