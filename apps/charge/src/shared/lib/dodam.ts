const TOKEN_QUERY_KEYS = ["token", "accessToken", "dodamToken"] as const;
const DODAM_TOKEN_KEY = "flick:charge:dodam-token";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  for (const key of TOKEN_QUERY_KEYS) {
    const value = params.get(key);
    if (value) {
      return value;
    }
  }
  return null;
}

function stripTokenFromUrl(): void {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of TOKEN_QUERY_KEYS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(null, "", url.toString());
  }
}

let captured = false;

function captureTokenFromUrl(): void {
  if (captured) {
    return;
  }
  captured = true;
  const token = readTokenFromUrl();
  if (!token) {
    return;
  }
  try {
    window.localStorage.setItem(DODAM_TOKEN_KEY, token);
  } catch {}
  stripTokenFromUrl();
}

export function readDodamToken(): string | null {
  captureTokenFromUrl();
  return read(DODAM_TOKEN_KEY);
}

export function forgetDodamToken(): void {
  captured = true;
  try {
    window.localStorage.removeItem(DODAM_TOKEN_KEY);
  } catch {}
}
