import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/mocks/server.ts";
import { ApiError } from "@/shared/api";
import { createBooth, fetchBooths } from "./booth-api.ts";

describe("booth-api", () => {
  it("fetchBooths parses the mocked list", async () => {
    const booths = await fetchBooths();

    expect(booths).toHaveLength(1);
    expect(booths[0]?.name).toBe("떡볶이 부스");
  });

  it("createBooth sends the payload and returns a draft booth", async () => {
    const created = await createBooth({ name: "새 부스" });

    expect(created.name).toBe("새 부스");
    expect(created.status).toBe("draft");
  });

  it("maps API error bodies to ApiError", async () => {
    server.use(
      http.get("/api/proxy/booths", () =>
        HttpResponse.json(
          { error: { code: "FORBIDDEN", message: "nope" } },
          { status: 403 },
        ),
      ),
    );

    await expect(fetchBooths()).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    await expect(fetchBooths()).rejects.toBeInstanceOf(ApiError);
  });
});
