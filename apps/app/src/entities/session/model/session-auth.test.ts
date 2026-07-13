import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { fetchMe } from "@/entities/user";
import { me } from "@/mocks/fixtures.ts";
import { server } from "@/mocks/server.ts";
import { installSessionAuth } from "./session-auth.ts";
import { clearTokens, writeTokens } from "./token-store.ts";

const DODAM_TOKEN_KEY = "flick:app:dodam-token";

installSessionAuth();

afterEach(() => {
  clearTokens();
  window.localStorage.removeItem(DODAM_TOKEN_KEY);
});

describe("session auth self-heal", () => {
  it("refreshes the access token and retries the original request on 401", async () => {
    writeTokens({ accessToken: "stale", refreshToken: "valid-refresh" });

    server.use(
      http.get("/v1/users/me", ({ request }) => {
        const auth = request.headers.get("Authorization");
        if (auth === "Bearer fresh-access") {
          return HttpResponse.json(me);
        }
        return HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "expired" } },
          { status: 401 },
        );
      }),
      http.post("/v1/auth/refresh", () =>
        HttpResponse.json({
          accessToken: "fresh-access",
          refreshToken: "next-refresh",
          expiresIn: 3600,
        }),
      ),
    );

    await expect(fetchMe()).resolves.toEqual(me);
    expect(window.localStorage.getItem("flick:app:access-token")).toBe(
      "fresh-access",
    );
  });

  it("re-exchanges the dodam token when refresh also fails", async () => {
    writeTokens({ accessToken: "stale", refreshToken: "dead-refresh" });
    window.localStorage.setItem(DODAM_TOKEN_KEY, "dodam-token");

    server.use(
      http.get("/v1/users/me", ({ request }) => {
        const auth = request.headers.get("Authorization");
        if (auth === "Bearer reissued-access") {
          return HttpResponse.json(me);
        }
        return HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "expired" } },
          { status: 401 },
        );
      }),
      http.post("/v1/auth/refresh", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "expired" } },
          { status: 401 },
        ),
      ),
      http.post("/v1/auth/app", () =>
        HttpResponse.json({
          accessToken: "reissued-access",
          refreshToken: "reissued-refresh",
          expiresIn: 3600,
        }),
      ),
    );

    await expect(fetchMe()).resolves.toEqual(me);
    expect(window.localStorage.getItem("flick:app:access-token")).toBe(
      "reissued-access",
    );
  });

  it("clears the session when refresh and dodam re-exchange both fail", async () => {
    writeTokens({ accessToken: "stale", refreshToken: "dead-refresh" });

    server.use(
      http.get("/v1/users/me", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "expired" } },
          { status: 401 },
        ),
      ),
      http.post("/v1/auth/refresh", () =>
        HttpResponse.json(
          { error: { code: "UNAUTHORIZED", message: "expired" } },
          { status: 401 },
        ),
      ),
    );

    await expect(fetchMe()).rejects.toThrow();
    expect(window.localStorage.getItem("flick:app:access-token")).toBeNull();
  });
});
