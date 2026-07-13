import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server.ts";
import { ApiError } from "@/shared/api";
import { createBooth, fetchMyBooth } from "./booth-api.ts";

describe("booth-api", () => {
  it("fetchMyBooth parses the mocked booth", async () => {
    const booth = await fetchMyBooth();

    expect(booth?.name).toBe("떡볶이 부스");
  });

  it("fetchMyBooth returns null when the caller has no booth", async () => {
    server.use(
      http.get("/api/proxy/users/me/booth", () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "booth not found" } },
          { status: 404 },
        ),
      ),
    );

    await expect(fetchMyBooth()).resolves.toBeNull();
  });

  it("createBooth sends the payload and returns a pending booth", async () => {
    const created = await createBooth({ name: "새 부스" });

    expect(created.name).toBe("새 부스");
    expect(created.status).toBe("pending");
  });

  it("maps API error bodies to ApiError", async () => {
    server.use(
      http.get("/api/proxy/users/me/booth", () =>
        HttpResponse.json(
          { error: { code: "FORBIDDEN", message: "nope" } },
          { status: 403 },
        ),
      ),
    );

    await expect(fetchMyBooth()).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    await expect(fetchMyBooth()).rejects.toBeInstanceOf(ApiError);
  });
});
