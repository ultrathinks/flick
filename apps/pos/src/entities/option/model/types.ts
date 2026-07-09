import { z } from "zod";

export const optionValueSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  name: z.string(),
  priceDelta: z.number(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const optionGroupSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  required: z.boolean(),
  maxSelect: z.number().nullable(),
  sortOrder: z.number(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  values: z.array(optionValueSchema),
});

export type OptionValue = z.infer<typeof optionValueSchema>;
export type OptionGroup = z.infer<typeof optionGroupSchema>;
