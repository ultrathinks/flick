import { z } from "zod";

export const boothStatuses = [
  "draft",
  "pending",
  "approved",
  "rejected",
] as const;

export type BoothStatus = (typeof boothStatuses)[number];

export const boothSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  status: z.enum(boothStatuses),
  approvedAt: z.coerce.date().nullable(),
  archivedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Booth = z.infer<typeof boothSchema>;
