import { z } from "zod";

const envSchema = z.object({
  BASE_API_URL: z.url(),
  BASE_INTERNAL_API_URL: z.url().optional(),
  BASE_URL: z.url(),
  DAUTH_AUTHORIZE_URL: z.url(),
  DAUTH_CLIENT_ID: z.string().min(1),
  DAUTH_REDIRECT_URI: z.url(),
});

const env = envSchema.parse({
  BASE_API_URL: process.env.BASE_API_URL,
  BASE_INTERNAL_API_URL: process.env.BASE_INTERNAL_API_URL,
  BASE_URL: process.env.BASE_URL,
  DAUTH_AUTHORIZE_URL: process.env.DAUTH_AUTHORIZE_URL,
  DAUTH_CLIENT_ID: process.env.DAUTH_CLIENT_ID,
  DAUTH_REDIRECT_URI: process.env.DAUTH_REDIRECT_URI,
});

export const API_INTERNAL_BASE_URL =
  env.BASE_INTERNAL_API_URL ?? env.BASE_API_URL;
export const BASE_URL = env.BASE_URL;
export const DAUTH_AUTHORIZE_URL = env.DAUTH_AUTHORIZE_URL;
export const DAUTH_CLIENT_ID = env.DAUTH_CLIENT_ID;
export const DAUTH_REDIRECT_URI = env.DAUTH_REDIRECT_URI;
export const DAUTH_SCOPE = "profile:read";
