import { z } from "zod";

export const boothSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  approvedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Booth = z.infer<typeof boothSchema>;
