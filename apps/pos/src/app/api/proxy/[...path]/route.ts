import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  COOKIE_OPTIONS,
  REFRESH_COOKIE,
} from "@/shared/auth/cookies";
import { refreshSession } from "@/shared/auth/server";
import { API_BASE_URL } from "@/shared/config";

async function forward(
  request: Request,
  path: string[],
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }

  const search = new URL(request.url).search;
  const target = `${API_BASE_URL}/${path.join("/")}${search}`;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  const call = (token: string) =>
    fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
      body,
    });

  let response = await call(accessToken);

  if (response.status === 401) {
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      try {
        const tokens = await refreshSession(refreshToken);
        cookieStore.set(ACCESS_COOKIE, tokens.accessToken, {
          ...COOKIE_OPTIONS,
          maxAge: tokens.expiresIn,
        });
        cookieStore.set(REFRESH_COOKIE, tokens.refreshToken, {
          ...COOKIE_OPTIONS,
          maxAge: 60 * 60 * 24 * 30,
        });
        response = await call(tokens.accessToken);
      } catch {
        cookieStore.delete(ACCESS_COOKIE);
        cookieStore.delete(REFRESH_COOKIE);
      }
    }
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/proxy/[...path]">,
) {
  return forward(request, (await ctx.params).path);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/proxy/[...path]">,
) {
  return forward(request, (await ctx.params).path);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/proxy/[...path]">,
) {
  return forward(request, (await ctx.params).path);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/proxy/[...path]">,
) {
  return forward(request, (await ctx.params).path);
}
