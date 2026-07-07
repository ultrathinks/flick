import { createHash, randomBytes } from "node:crypto";

export function generateSecret(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function maskAccountNumber(value: string): string {
  if (value.length <= 4) {
    return "****";
  }
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}
