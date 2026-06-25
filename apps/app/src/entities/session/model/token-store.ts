const ACCESS_TOKEN_KEY = "flick::access-token";
const REFRESH_TOKEN_KEY = "flick::refresh-token";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readTokens(): SessionTokens | null {
  const accessToken = read(ACCESS_TOKEN_KEY);
  const refreshToken = read(REFRESH_TOKEN_KEY);
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}

export function readAccessToken(): string | null {
  return read(ACCESS_TOKEN_KEY);
}

export function readRefreshToken(): string | null {
  return read(REFRESH_TOKEN_KEY);
}

export function writeTokens(tokens: SessionTokens): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
