import { randomUUID } from "node:crypto";
import { z } from "@hono/zod-openapi";
import {
  type DauthConfig,
  DODAM_AUTHORIZE_URL,
  DODAM_CONSENT_URL,
  DODAM_SCOPE,
  DODAM_TOKEN_URL,
  DODAM_USER_INFO_URL,
  getAppDauthConfig,
} from "../config.ts";
import type { NewUser } from "../db/schema/index.ts";
import { AppError } from "../lib/errors.ts";
import { logger } from "../lib/logger.ts";

const DODAM_REQUEST_TIMEOUT_MS = 10_000;

export class DodamError extends AppError {
  constructor(message: string, status: 400 | 401 = 400) {
    super(status, "DODAM_ERROR", message);
  }
}

const authorizeResponseSchema = z.object({
  data: z.object({ consented: z.boolean() }),
});

const consentResponseSchema = z.object({
  data: z.object({ redirectUri: z.string() }),
});

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

const studentSchema = z.object({
  grade: z.number().nullable(),
  room: z.number().nullable(),
  number: z.number().nullable(),
});

const userInfoResponseSchema = z.object({
  data: z.object({
    publicId: z.string().min(1),
    username: z.string(),
    name: z.string(),
    profileImage: z.string().nullish(),
    roles: z.array(z.string()),
    student: studentSchema.nullish(),
  }),
});

type DodamStudent = z.infer<typeof studentSchema>;

async function dodamFetch(
  context: string,
  input: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      signal: AbortSignal.timeout(DODAM_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logger.error({ context, reason }, "dodam request failed");
    throw new DodamError(`Dodam ${context} request failed`);
  }
}

async function ensureOk(
  response: Response,
  context: string,
): Promise<Response> {
  if (response.ok) {
    return response;
  }
  const body = await response.text().catch(() => "");
  logger.error(
    { context, status: response.status, body },
    "dodam non-ok response",
  );
  throw new DodamError(
    `Dodam ${context} failed`,
    response.status === 401 ? 401 : 400,
  );
}

async function parseJson<T>(
  response: Response,
  schema: z.ZodType<T>,
  context: string,
): Promise<T> {
  const json: unknown = await response.json().catch(() => null);
  const result = schema.safeParse(json);
  if (!result.success) {
    logger.error(
      { context, issues: result.error.issues },
      "dodam invalid response",
    );
    throw new DodamError(`Dodam ${context} returned an unexpected response`);
  }
  return result.data;
}

async function requestDodamToken(
  body: URLSearchParams,
  context: string,
): Promise<string> {
  const response = await ensureOk(
    await dodamFetch(context, DODAM_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }),
    context,
  );
  const tokens = await parseJson(response, tokenResponseSchema, context);
  return tokens.access_token;
}

async function authorize(
  dodamAccessToken: string,
  state: string,
): Promise<boolean> {
  const config = getAppDauthConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: DODAM_SCOPE,
    state,
  });

  const response = await ensureOk(
    await dodamFetch("authorize", `${DODAM_AUTHORIZE_URL}?${params}`, {
      headers: { Authorization: `Bearer ${dodamAccessToken}` },
    }),
    "authorize",
  );
  const body = await parseJson(response, authorizeResponseSchema, "authorize");
  return body.data.consented;
}

async function consent(
  dodamAccessToken: string,
  state: string,
): Promise<string> {
  const config = getAppDauthConfig();
  const response = await ensureOk(
    await dodamFetch("consent", DODAM_CONSENT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${dodamAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scope: DODAM_SCOPE,
        state,
        approved: true,
      }),
    }),
    "consent",
  );

  const body = await parseJson(response, consentResponseSchema, "consent");
  const code = parseCodeFromRedirect(body.data.redirectUri);
  if (!code) {
    throw new DodamError("Dodam consent did not return a code");
  }
  return code;
}

function parseCodeFromRedirect(redirectUri: string): string | null {
  try {
    return new URL(redirectUri).searchParams.get("code");
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const config = getAppDauthConfig();
  return requestDodamToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    "app_token_exchange",
  );
}

export async function exchangeDodamToken(
  dodamAccessToken: string,
): Promise<string> {
  const state = randomUUID();
  await authorize(dodamAccessToken, state);
  const code = await consent(dodamAccessToken, state);
  return exchangeCodeForToken(code);
}

export async function exchangeAuthorizationCode(
  params: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  },
  config: DauthConfig,
): Promise<string> {
  if (params.redirectUri !== config.redirectUri) {
    throw new DodamError("invalid redirect uri");
  }
  return requestDodamToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: params.codeVerifier,
    }),
    "pkce_code_exchange",
  );
}

function toStudentNumber(
  student: DodamStudent | null | undefined,
): string | null {
  if (!student?.grade || !student.room || !student.number) {
    return null;
  }
  return `${student.grade}${student.room}${String(student.number).padStart(2, "0")}`;
}

export type DauthProfile = Omit<NewUser, "code">;

export async function getUserInfo(
  oauthAccessToken: string,
): Promise<DauthProfile> {
  const response = await ensureOk(
    await dodamFetch("user_info", DODAM_USER_INFO_URL, {
      headers: { Authorization: `Bearer ${oauthAccessToken}` },
    }),
    "user_info",
  );

  const body = await parseJson(response, userInfoResponseSchema, "user_info");
  const info = body.data;

  return {
    dauthPublicId: info.publicId,
    username: info.username,
    name: info.name,
    profileImageUrl: info.profileImage ?? null,
    roles: info.roles,
    studentNumber: toStudentNumber(info.student),
  };
}
