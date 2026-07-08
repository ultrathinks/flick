function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

const DODAM_API_BASE = "https://dodam-api.b1nd.com";

export const DODAM_AUTHORIZE_URL = `${DODAM_API_BASE}/oauth/authorize`;
export const DODAM_CONSENT_URL = `${DODAM_API_BASE}/oauth/authorize/consent`;
export const DODAM_TOKEN_URL = `${DODAM_API_BASE}/oauth/token`;
export const DODAM_USER_INFO_URL = `${DODAM_API_BASE}/user/me`;

export const DODAM_SCOPE = "profile:read";

export type DauthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getAppDauthConfig(): DauthConfig {
  return {
    clientId: requireEnv("DAUTH_CLIENT_ID"),
    clientSecret: requireEnv("DAUTH_CLIENT_SECRET"),
    redirectUri: requireEnv("DAUTH_REDIRECT_URI"),
  };
}

export function getPosDauthConfig(): DauthConfig {
  return {
    clientId: requireEnv("DAUTH_POS_CLIENT_ID"),
    clientSecret: requireEnv("DAUTH_POS_CLIENT_SECRET"),
    redirectUri: requireEnv("DAUTH_POS_REDIRECT_URI"),
  };
}

export function getAdminDauthConfig(): DauthConfig {
  return {
    clientId: requireEnv("DAUTH_ADMIN_CLIENT_ID"),
    clientSecret: requireEnv("DAUTH_ADMIN_CLIENT_SECRET"),
    redirectUri: requireEnv("DAUTH_ADMIN_REDIRECT_URI"),
  };
}

export function getCorsOrigins(): string[] {
  const origins = requireEnv("CORS_ORIGIN")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN is empty");
  }
  return origins;
}

export function getS3Config() {
  return {
    endpoint: requireEnv("S3_ENDPOINT"),
    region: requireEnv("S3_REGION"),
    bucket: requireEnv("S3_BUCKET"),
    accessKeyId: requireEnv("S3_ACCESS_KEY"),
    secretAccessKey: requireEnv("S3_SECRET_KEY"),
    publicBaseUrl: requireEnv("S3_PUBLIC_BASE_URL"),
  };
}
