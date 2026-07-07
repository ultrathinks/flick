import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
} from "@/shared/auth/cookies";
import { exchangeDauthCode } from "@/shared/auth/server";
import { BASE_URL, DAUTH_REDIRECT_URI } from "@/shared/config";

const VERIFIER_COOKIE = "flick_admin_verifier";
const STATE_COOKIE = "flick_admin_state";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value;

  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(VERIFIER_COOKIE);

  if (!code || !state || !verifier || state !== expectedState) {
    return NextResponse.redirect(`${BASE_URL}/login?error=invalid_request`);
  }

  try {
    const tokens = await exchangeDauthCode({
      code,
      codeVerifier: verifier,
      redirectUri: DAUTH_REDIRECT_URI,
    });
    cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: tokens.expiresIn,
    });
    cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    });
    return NextResponse.redirect(`${BASE_URL}/`);
  } catch {
    return NextResponse.redirect(`${BASE_URL}/login?error=exchange_failed`);
  }
}
