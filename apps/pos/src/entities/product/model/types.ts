import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  boothId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.number(),
  stock: z.number().nullable(),
  status: z.enum(["available", "hidden"]),
  sortOrder: z.number(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;
