import { z } from "@hono/zod-openapi";

const DODAM_API_BASE = "https://dodam-api.b1nd.com";

export const DODAM_AUTHORIZE_URL = `${DODAM_API_BASE}/oauth/authorize`;
export const DODAM_CONSENT_URL = `${DODAM_API_BASE}/oauth/authorize/consent`;
export const DODAM_TOKEN_URL = `${DODAM_API_BASE}/oauth/token`;
export const DODAM_USER_INFO_URL = `${DODAM_API_BASE}/user/me`;

export const DODAM_SCOPE = "profile:read";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  DAUTH_CLIENT_ID: z.string().min(1),
  DAUTH_CLIENT_SECRET: z.string().min(1),
  DAUTH_REDIRECT_URI: z.string().url(),
  DAUTH_POS_CLIENT_ID: z.string().min(1),
  DAUTH_POS_CLIENT_SECRET: z.string().min(1),
  DAUTH_POS_REDIRECT_URI: z.string().url(),
  DAUTH_ADMIN_CLIENT_ID: z.string().min(1),
  DAUTH_ADMIN_CLIENT_SECRET: z.string().min(1),
  DAUTH_ADMIN_REDIRECT_URI: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_PUBLIC_BASE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function loadConfig(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map(
          (issue) =>
            `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
        )
        .join("\n");
      throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    cached = Object.freeze(parsed.data);
  }
  return cached;
}

export function isProduction(): boolean {
  return loadConfig().NODE_ENV === "production";
}

export type DauthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getAppDauthConfig(): DauthConfig {
  const config = loadConfig();
  return {
    clientId: config.DAUTH_CLIENT_ID,
    clientSecret: config.DAUTH_CLIENT_SECRET,
    redirectUri: config.DAUTH_REDIRECT_URI,
  };
}

export function getPosDauthConfig(): DauthConfig {
  const config = loadConfig();
  return {
    clientId: config.DAUTH_POS_CLIENT_ID,
    clientSecret: config.DAUTH_POS_CLIENT_SECRET,
    redirectUri: config.DAUTH_POS_REDIRECT_URI,
  };
}

export function getAdminDauthConfig(): DauthConfig {
  const config = loadConfig();
  return {
    clientId: config.DAUTH_ADMIN_CLIENT_ID,
    clientSecret: config.DAUTH_ADMIN_CLIENT_SECRET,
    redirectUri: config.DAUTH_ADMIN_REDIRECT_URI,
  };
}

export function getCorsOrigins(): string[] {
  const origins = loadConfig()
    .CORS_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN is empty");
  }
  return origins;
}

export function getS3Config() {
  const config = loadConfig();
  return {
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    bucket: config.S3_BUCKET,
    accessKeyId: config.S3_ACCESS_KEY,
    secretAccessKey: config.S3_SECRET_KEY,
    publicBaseUrl: config.S3_PUBLIC_BASE_URL,
  };
}
