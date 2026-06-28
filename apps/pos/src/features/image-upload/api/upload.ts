import { z } from "zod";
import { request } from "@/shared/api";

const presignSchema = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  key: z.string(),
});

export async function uploadImage(params: {
  kind: "booth" | "product";
  targetId: string;
  file: File;
}): Promise<string> {
  const presign = await request(presignSchema, "uploads/presign", {
    method: "post",
    json: {
      kind: params.kind,
      targetId: params.targetId,
      contentType: params.file.type,
    },
  });
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": params.file.type },
    body: params.file,
  });
  if (!put.ok) {
    throw new Error("upload failed");
  }
  return presign.publicUrl;
}
