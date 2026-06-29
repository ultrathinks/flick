import { randomUUID } from "node:crypto";
import {
  DODAM_AUTHORIZE_URL,
  DODAM_CONSENT_URL,
  DODAM_SCOPE,
  DODAM_TOKEN_URL,
  DODAM_USER_INFO_URL,
  getDodamConfig,
  getDodamPosConfig,
} from "../config.ts";
import type { NewUser } from "../db/schema/index.ts";
import { AppError } from "../lib/errors.ts";

export class DodamError extends AppError {
  constructor(message: string, status: 400 | 401 = 400) {
    super(status, "DODAM_ERROR", message);
  }
}

type DodamConsentResponse = {
  data: {
    redirectUri: string;
  };
};

type DodamTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

type DodamStudent = {
  grade: number | null;
  room: number | null;
  number: number | null;
};

type DodamUserInfo = {
  publicId: string;
  username: string;
  name: string;
  profileImage: string | null;
  roles: string[];
  student: DodamStudent | null;
};

type DodamUserInfoResponse = {
  data: DodamUserInfo;
};

async function authorize(dodamAccessToken: string, state: string) {
  const config = getDodamConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: DODAM_SCOPE,
    state,
  });

  const response = await fetch(`${DODAM_AUTHORIZE_URL}?${params}`, {
    headers: { Authorization: `Bearer ${dodamAccessToken}` },
  });

  if (!response.ok) {
    throw new DodamError(
      "Dodam authorize failed",
      response.status === 401 ? 401 : 400,
    );
  }
}

async function consent(
  dodamAccessToken: string,
  state: string,
): Promise<string> {
  const config = getDodamConfig();
  const response = await fetch(DODAM_CONSENT_URL, {
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
  });

  if (!response.ok) {
    throw new DodamError(
      "Dodam consent failed",
      response.status === 401 ? 401 : 400,
    );
  }

  const body = (await response.json()) as DodamConsentResponse;
  const code = new URL(body.data.redirectUri).searchParams.get("code");
  if (!code) {
    throw new DodamError("Dodam consent did not return a code");
  }
  return code;
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const config = getDodamConfig();
  const response = await fetch(DODAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new DodamError(
      "Dodam token exchange failed",
      response.status === 401 ? 401 : 400,
    );
  }

  const tokens = (await response.json()) as DodamTokenResponse;
  return tokens.access_token;
}

export async function exchangeDodamToken(
  dodamAccessToken: string,
): Promise<string> {
  const state = randomUUID();
  await authorize(dodamAccessToken, state);
  const code = await consent(dodamAccessToken, state);
  return exchangeCodeForToken(code);
}

export async function exchangeAuthorizationCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<string> {
  const config = getDodamPosConfig();
  if (params.redirectUri !== config.redirectUri) {
    throw new DodamError("invalid redirect uri");
  }
  const response = await fetch(DODAM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code_verifier: params.codeVerifier,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    console.error(
      `[dodam] exchange_failed status=${response.status} body=${responseBody}`,
    );
    throw new DodamError(
      "Dodam authorization code exchange failed",
      response.status === 401 ? 401 : 400,
    );
  }

  const tokens = (await response.json()) as DodamTokenResponse;
  return tokens.access_token;
}

function toStudentNumber(student: DodamStudent | null): string | null {
  if (!student?.grade || !student.room || !student.number) {
    return null;
  }
  return `${student.grade}${student.room}${String(student.number).padStart(2, "0")}`;
}

export async function getUserInfo(oauthAccessToken: string): Promise<NewUser> {
  const response = await fetch(DODAM_USER_INFO_URL, {
    headers: { Authorization: `Bearer ${oauthAccessToken}` },
  });

  if (!response.ok) {
    throw new DodamError("Dodam user info request failed", 401);
  }

  const body = (await response.json()) as DodamUserInfoResponse;
  const info = body.data;

  return {
    dauthPublicId: info.publicId,
    username: info.username,
    name: info.name,
    profileImageUrl: info.profileImage,
    roles: info.roles,
    studentNumber: toStudentNumber(info.student),
  };
}
