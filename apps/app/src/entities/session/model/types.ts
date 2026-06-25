import { z } from "zod";

export const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;
