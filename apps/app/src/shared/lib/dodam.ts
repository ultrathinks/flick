const TOKEN_QUERY_KEYS = ["token", "accessToken", "dodamToken"] as const;

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

let capturedToken: string | null | undefined;

export function takeDodamTokenFromUrl(): string | null {
  if (capturedToken === undefined) {
    capturedToken = readTokenFromUrl();
    if (capturedToken) {
      stripTokenFromUrl();
    }
  }
  return capturedToken;
}

export function forgetDodamToken(): void {
  capturedToken = null;
}
