import { randomUUID } from "node:crypto";
import {
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getS3Config } from "../config.ts";

const MAX_IMAGE_DIMENSION = 1024;
const WEBP_QUALITY = 80;
const LIMIT_INPUT_PIXELS = 24_000_000;
const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

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

export function isSupportedImage(input: Buffer): boolean {
  const isPng =
    input[0] === 0x89 &&
    input[1] === 0x50 &&
    input[2] === 0x4e &&
    input[3] === 0x47;
  const isJpeg = input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
  const isWebp =
    input[0] === 0x52 &&
    input[1] === 0x49 &&
    input[2] === 0x46 &&
    input[3] === 0x46 &&
    input[8] === 0x57 &&
    input[9] === 0x45 &&
    input[10] === 0x42 &&
    input[11] === 0x50;
  return isPng || isJpeg || isWebp;
}

export async function processAndUploadImage(params: {
  kind: "booth" | "product";
  targetId: string;
  input: Buffer;
}): Promise<string> {
  const config = getS3Config();
  const processed = await sharp(params.input, {
    limitInputPixels: LIMIT_INPUT_PIXELS,
  })
    .rotate()
    .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const key = `${params.kind}/${params.targetId}/${randomUUID()}.webp`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: processed,
      ContentType: "image/webp",
      CacheControl: IMAGE_CACHE_CONTROL,
    }),
  );
  return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
}

export async function checkStorage(): Promise<void> {
  const config = getS3Config();
  await getClient().send(new HeadBucketCommand({ Bucket: config.bucket }));
}
