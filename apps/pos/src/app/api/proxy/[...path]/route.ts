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
      : await request.arrayBuffer();

  const call = (token: string) =>
    fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: request.headers.get("accept") ?? "application/json",
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
      body,
      signal: request.signal,
    });

  let response = await call(accessToken);

  if (response.status === 401) {
    const refreshedToken = await rotateSession(cookieStore);
    if (refreshedToken) {
      response = await call(refreshedToken);
    }
  }

  const contentType =
    response.headers.get("content-type") ?? "application/json";

  if (contentType.includes("text/event-stream") && response.body) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": contentType },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
