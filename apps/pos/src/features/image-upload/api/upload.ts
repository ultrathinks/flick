import { z } from "zod";
import { request } from "@/shared/api";

const uploadResultSchema = z.object({ imageUrl: z.string() });

export async function uploadImage(params: {
  kind: "booth" | "product";
  targetId: string;
  file: File;
}): Promise<string> {
  const body = new FormData();
  body.set("kind", params.kind);
  body.set("targetId", params.targetId);
  body.set("file", params.file);
  const result = await request(uploadResultSchema, "uploads", {
    method: "post",
    body,
  });
  return result.imageUrl;
}
