const configDefaults: Record<string, string> = {
  CORS_ORIGIN: "http://localhost:3000",
  DAUTH_CLIENT_ID: "test-app-client",
  DAUTH_CLIENT_SECRET: "test-app-secret",
  DAUTH_REDIRECT_URI: "http://localhost:3000/auth/callback",
  DAUTH_POS_CLIENT_ID: "test-pos-client",
  DAUTH_POS_CLIENT_SECRET: "test-pos-secret",
  DAUTH_POS_REDIRECT_URI: "http://localhost:3002/auth/callback",
  DAUTH_ADMIN_CLIENT_ID: "test-admin-client",
  DAUTH_ADMIN_CLIENT_SECRET: "test-admin-secret",
  DAUTH_ADMIN_REDIRECT_URI: "http://localhost:3001/auth/callback",
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "us-east-1",
  S3_BUCKET: "test-bucket",
  S3_ACCESS_KEY: "test-access-key",
  S3_SECRET_KEY: "test-secret-key",
  S3_PUBLIC_BASE_URL: "http://localhost:9000/test-bucket",
};

for (const [key, value] of Object.entries(configDefaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
