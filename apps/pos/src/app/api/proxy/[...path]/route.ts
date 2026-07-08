import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readAccessToken, rotateSession } from "@/shared/auth/server";
import { API_INTERNAL_BASE_URL } from "@/shared/config";

function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 },
  );
}

async function forward(
  request: Request,
  path: string[],
): Promise<NextResponse> {
  const cookieStore = await cookies();
  let accessToken = readAccessToken(cookieStore);
  if (!accessToken) {
    accessToken = await rotateSession(cookieStore);
  }
  if (!accessToken) {
    return unauthorized();
  }

  const search = new URL(request.url).search;
  const target = `${API_INTERNAL_BASE_URL}/${path.join("/")}${search}`;
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
    const refreshedToken = await rotateSession(cookieStore);
    if (refreshedToken) {
      response = await call(refreshedToken);
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
