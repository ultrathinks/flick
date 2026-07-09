import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
} from "@/shared/auth/cookies";
import { BASE_URL } from "@/shared/config";

export async function GET(): Promise<NextResponse> {
  if (process.env.NEXT_PUBLIC_MOCK !== "1") {
    return new NextResponse(null, { status: 404 });
  }
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "mock-access-token", {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24,
  });
  cookieStore.set(REFRESH_COOKIE, "mock-refresh-token", {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(new URL("/", BASE_URL));
}
