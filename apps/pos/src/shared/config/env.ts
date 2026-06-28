export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/v1";

export const DAUTH_AUTHORIZE_URL =
  process.env.NEXT_PUBLIC_DAUTH_AUTHORIZE_URL ??
  "https://dauth.b1nd.com/authorize";

export const DAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_DAUTH_CLIENT_ID ?? "";

export const DAUTH_REDIRECT_URI =
  process.env.NEXT_PUBLIC_DAUTH_REDIRECT_URI ??
  "http://localhost:3002/api/auth/callback";

export const DAUTH_SCOPE = "profile:read";
