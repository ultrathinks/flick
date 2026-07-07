import { z } from "zod";

export const adminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  profileImageUrl: z.string().nullable(),
  roles: z.array(z.string()),
  isAdmin: z.boolean(),
  studentNumber: z.string().nullable(),
  balance: z.number(),
  createdAt: z.coerce.date(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;
