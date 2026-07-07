import { z } from "zod";

export const userCodeSchema = z.object({
  code: z.string(),
});

export type UserCode = z.infer<typeof userCodeSchema>;
