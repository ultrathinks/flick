import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { rotateSession } from "@/shared/auth/server";
import { BASE_URL } from "@/shared/config";

function safeNext(nextParam: string | null): string {
  if (!nextParam) {
    return "/";
  }
  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return "/";
  }
  return nextParam;
}

export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const cookieStore = await cookies();
  const accessToken = await rotateSession(cookieStore);

  if (!accessToken) {
    return NextResponse.redirect(`${BASE_URL}/login`);
  }
  return NextResponse.redirect(`${BASE_URL}${next}`);
}
