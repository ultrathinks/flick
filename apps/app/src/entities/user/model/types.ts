import { z } from "zod";

export const meSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  profileImageUrl: z.string().nullable(),
  roles: z.array(z.string()),
  isAdmin: z.boolean(),
  studentNumber: z.string().nullable(),
  balance: z.number(),
});

export type Me = z.infer<typeof meSchema>;
