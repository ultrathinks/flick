import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_OPTIONS } from "@/shared/auth/cookies";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "@/shared/auth/pkce";
import {
  DAUTH_AUTHORIZE_URL,
  DAUTH_CLIENT_ID,
  DAUTH_REDIRECT_URI,
  DAUTH_SCOPE,
} from "@/shared/config";

const VERIFIER_COOKIE = "flick_admin_verifier";
const STATE_COOKIE = "flick_admin_state";

export async function GET() {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: DAUTH_CLIENT_ID,
    redirect_uri: DAUTH_REDIRECT_URI,
    scope: DAUTH_SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const cookieStore = await cookies();
  const shortLived = { ...COOKIE_OPTIONS, maxAge: 600 };
  cookieStore.set(VERIFIER_COOKIE, verifier, shortLived);
  cookieStore.set(STATE_COOKIE, state, shortLived);

  return NextResponse.redirect(`${DAUTH_AUTHORIZE_URL}?${params}`);
}
