import { z } from "@hono/zod-openapi";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { Db, DbTransaction } from "../db/index.ts";
import {
  productOptionGroups,
  productOptionValues,
} from "../db/schema/index.ts";

export const optionValueInputSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const optionGroupInputSchema = z.object({
  name: z.string().min(1),
  required: z.boolean().optional(),
  maxSelect: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
  values: z.array(optionValueInputSchema),
});

export const optionsInputSchema = z.array(optionGroupInputSchema);

export type OptionGroupInput = z.infer<typeof optionGroupInputSchema>;

type GroupRow = typeof productOptionGroups.$inferSelect;
type ValueRow = typeof productOptionValues.$inferSelect;
export type GroupWithValues = GroupRow & { values: ValueRow[] };

export async function loadProductOptions(
  tx: Db | DbTransaction,
  productIds: string[],
): Promise<Map<string, GroupWithValues[]>> {
  const byProduct = new Map<string, GroupWithValues[]>();
  if (productIds.length === 0) {
    return byProduct;
  }
  const groups = await tx
    .select()
    .from(productOptionGroups)
    .where(
      and(
        inArray(productOptionGroups.productId, productIds),
        isNull(productOptionGroups.archivedAt),
      ),
    )
    .orderBy(asc(productOptionGroups.sortOrder));
  const groupIds = groups.map((group) => group.id);
  const values =
    groupIds.length > 0
      ? await tx
          .select()
          .from(productOptionValues)
          .where(
            and(
              inArray(productOptionValues.groupId, groupIds),
              isNull(productOptionValues.archivedAt),
            ),
          )
          .orderBy(asc(productOptionValues.sortOrder))
      : [];
  const valuesByGroup = new Map<string, ValueRow[]>();
  for (const value of values) {
    const list = valuesByGroup.get(value.groupId) ?? [];
    list.push(value);
    valuesByGroup.set(value.groupId, list);
  }
  for (const group of groups) {
    const list = byProduct.get(group.productId) ?? [];
    list.push({ ...group, values: valuesByGroup.get(group.id) ?? [] });
    byProduct.set(group.productId, list);
  }
  return byProduct;
}

export async function replaceProductOptions(
  tx: DbTransaction,
  productId: string,
  groups: OptionGroupInput[],
): Promise<GroupWithValues[]> {
  await tx
    .delete(productOptionGroups)
    .where(eq(productOptionGroups.productId, productId));

  const result: GroupWithValues[] = [];
  for (const [groupIndex, group] of groups.entries()) {
    const [createdGroup] = await tx
      .insert(productOptionGroups)
      .values({
        productId,
        name: group.name,
        required: group.required ?? true,
        maxSelect: group.maxSelect ?? null,
        sortOrder: group.sortOrder ?? groupIndex,
      })
      .returning();
    if (!createdGroup) {
      throw new Error("failed to create option group");
    }
    const values: ValueRow[] = [];
    let defaultTaken = false;
    for (const [valueIndex, value] of group.values.entries()) {
      const isDefault = Boolean(value.isDefault) && !defaultTaken;
      if (isDefault) {
        defaultTaken = true;
      }
      const [createdValue] = await tx
        .insert(productOptionValues)
        .values({
          groupId: createdGroup.id,
          name: value.name,
          priceDelta: value.priceDelta ?? 0,
          isDefault,
          sortOrder: value.sortOrder ?? valueIndex,
        })
        .returning();
      if (!createdValue) {
        throw new Error("failed to create option value");
      }
      values.push(createdValue);
    }
    result.push({ ...createdGroup, values });
  }
  return result;
}
