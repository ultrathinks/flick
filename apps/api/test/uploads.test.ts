import { eq } from "drizzle-orm";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../src/lib/storage.ts", async (importActual) => {
  const actual = await importActual<typeof import("../src/lib/storage.ts")>();
  return {
    ...actual,
    processAndUploadImage: vi.fn(
      async () => "https://cdn.example.com/booth/processed.webp",
    ),
  };
});

import { app } from "../src/app.ts";
import { getDb } from "../src/db/index.ts";
import { booths } from "../src/db/schema/index.ts";
import { closeEvents } from "../src/lib/events.ts";
import { isSupportedImage } from "../src/lib/storage.ts";
import { createBoothWithKiosk, createUser, resetDb } from "./helpers.ts";

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
]);

function uploadRequest(
  token: string,
  fields: { kind?: string; targetId?: string; file?: Buffer | null },
) {
  const form = new FormData();
  if (fields.kind !== undefined) {
    form.set("kind", fields.kind);
  }
  if (fields.targetId !== undefined) {
    form.set("targetId", fields.targetId);
  }
  if (fields.file) {
    form.set(
      "file",
      new File([fields.file], "image.png", { type: "image/png" }),
    );
  }
  return app.request("/v1/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for integration tests");
  }
});

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeEvents();
});

describe("isSupportedImage", () => {
  it("accepts png, jpeg, and webp signatures", () => {
    expect(isSupportedImage(PNG)).toBe(true);
    expect(isSupportedImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(
      isSupportedImage(
        Buffer.from([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
          0x50,
        ]),
      ),
    ).toBe(true);
  });

  it("rejects non-image and truncated buffers", () => {
    expect(isSupportedImage(Buffer.from("not an image"))).toBe(false);
    expect(isSupportedImage(Buffer.from([0x89, 0x50]))).toBe(false);
    expect(isSupportedImage(Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00]))).toBe(
      false,
    );
  });
});

describe("POST /v1/uploads", () => {
  it("processes an image and writes the target imageUrl", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const res = await uploadRequest(owner.accessToken, {
      kind: "booth",
      targetId: boothId,
      file: PNG,
    });
    expect(res.status).toBe(201);
    expect((await res.json()).imageUrl).toBe(
      "https://cdn.example.com/booth/processed.webp",
    );
    const [booth] = await getDb()
      .select()
      .from(booths)
      .where(eq(booths.id, boothId));
    expect(booth?.imageUrl).toBe(
      "https://cdn.example.com/booth/processed.webp",
    );
  });

  it("rejects a request with no file", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const res = await uploadRequest(owner.accessToken, {
      kind: "booth",
      targetId: boothId,
      file: null,
    });
    expect(res.status).toBe(400);
  });

  it("rejects an unsupported file format", async () => {
    const owner = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const res = await uploadRequest(owner.accessToken, {
      kind: "booth",
      targetId: boothId,
      file: Buffer.from("this is not an image"),
    });
    expect(res.status).toBe(400);
  });

  it("forbids uploading to a booth the caller does not own", async () => {
    const owner = await createUser();
    const other = await createUser();
    const { boothId } = await createBoothWithKiosk(owner.id);
    const res = await uploadRequest(other.accessToken, {
      kind: "booth",
      targetId: boothId,
      file: PNG,
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown target", async () => {
    const owner = await createUser();
    const res = await uploadRequest(owner.accessToken, {
      kind: "booth",
      targetId: "00000000-0000-0000-0000-000000000000",
      file: PNG,
    });
    expect(res.status).toBe(404);
  });
});
