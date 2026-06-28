import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/shared/auth/cookies";

export async function GET() {
  const cookieStore = await cookies();
  const authenticated =
    cookieStore.has(ACCESS_COOKIE) || cookieStore.has(REFRESH_COOKIE);
  return NextResponse.json({ authenticated });
}
