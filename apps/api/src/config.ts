function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}

const DODAM_API_BASE = "https://dodam-api.b1nd.com";

export const DODAM_AUTHORIZE_URL = `${DODAM_API_BASE}/oauth/authorize`;
export const DODAM_CONSENT_URL = `${DODAM_API_BASE}/oauth/authorize/consent`;
export const DODAM_TOKEN_URL = `${DODAM_API_BASE}/oauth/token`;
export const DODAM_USER_INFO_URL = `${DODAM_API_BASE}/user/me`;

export const DODAM_SCOPE = "profile:read";

export function getDodamConfig() {
  return {
    clientId: requireEnv("DAUTH_CLIENT_ID"),
    clientSecret: requireEnv("DAUTH_CLIENT_SECRET"),
    redirectUri: requireEnv("DAUTH_REDIRECT_URI"),
  };
}
