import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/shared/auth/cookies";
import { revokeSession } from "@/shared/auth/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    try {
      await revokeSession(accessToken);
    } catch {}
  }
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
