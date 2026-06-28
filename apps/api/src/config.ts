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

export function getEncryptionKey(): Buffer {
  const key = Buffer.from(requireEnv("PAYOUT_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) {
    throw new Error("PAYOUT_ENCRYPTION_KEY must be 32 bytes base64");
  }
  return key;
}

export function getBootstrapAdminPublicIds(): string[] {
  return (process.env.DAUTH_ADMIN_PUBLIC_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getS3Config() {
  return {
    endpoint: requireEnv("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: requireEnv("S3_BUCKET"),
    accessKeyId: requireEnv("S3_ACCESS_KEY"),
    secretAccessKey: requireEnv("S3_SECRET_KEY"),
    publicBaseUrl: requireEnv("S3_PUBLIC_BASE_URL"),
  };
}
