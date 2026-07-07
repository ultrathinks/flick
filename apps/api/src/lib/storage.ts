import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Config } from "../config.ts";

const PRESIGN_TTL_SECONDS = 300;

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export const ALLOWED_UPLOAD_CONTENT_TYPES = Object.keys(
  EXTENSION_BY_CONTENT_TYPE,
);

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    const config = getS3Config();
    client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

export function isAllowedContentType(contentType: string): boolean {
  return contentType in EXTENSION_BY_CONTENT_TYPE;
}

export async function presignUpload(params: {
  kind: "booth" | "product";
  targetId: string;
  contentType: string;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const config = getS3Config();
  const extension = EXTENSION_BY_CONTENT_TYPE[params.contentType];
  if (!extension) {
    throw new Error(`unsupported content type: ${params.contentType}`);
  }
  const key = `${params.kind}/${params.targetId}/${randomUUID()}.${extension}`;
  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: params.contentType,
    }),
    { expiresIn: PRESIGN_TTL_SECONDS },
  );
  const publicUrl = `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  return { uploadUrl, publicUrl, key };
}
