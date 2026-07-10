import { randomInt } from "node:crypto";

const DIGITS = "0123456789";
const UNAMBIGUOUS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomFrom(alphabet: string, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

export function generateDigitCode(length = 6): string {
  return randomFrom(DIGITS, length);
}

export function generatePairingCode(length = 6): string {
  return randomFrom(UNAMBIGUOUS, length);
}

export async function generateUniqueCode(
  make: () => string,
  exists: (code: string) => Promise<boolean>,
  maxAttempts = 10,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = make();
    if (!(await exists(code))) {
      return code;
    }
  }
  throw new Error("failed to generate a unique code");
}
