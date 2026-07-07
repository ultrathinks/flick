import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureAccessToken } from "@/shared/auth/server";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = await ensureAccessToken(cookieStore);
  return NextResponse.json({ authenticated: accessToken !== null });
}
