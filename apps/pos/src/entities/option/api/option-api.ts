import { z } from "zod";
import { request, requestVoid } from "@/shared/api";
import {
  type OptionGroup,
  optionGroupSchema,
  optionValueSchema,
} from "../model/types.ts";

export function fetchProductOptions(productId: string): Promise<OptionGroup[]> {
  return request(z.array(optionGroupSchema), `products/${productId}/options`);
}

export function createOptionGroup(
  productId: string,
  input: { name: string; required?: boolean; sortOrder?: number },
) {
  return request(
    optionGroupSchema.omit({ values: true }),
    `products/${productId}/option-groups`,
    { method: "post", json: input },
  );
}

export function deleteOptionGroup(groupId: string): Promise<void> {
  return requestVoid(`option-groups/${groupId}`, { method: "delete" });
}

export function createOptionValue(
  groupId: string,
  input: {
    name: string;
    priceDelta?: number;
    isDefault?: boolean;
    sortOrder?: number;
  },
) {
  return request(optionValueSchema, `option-groups/${groupId}/values`, {
    method: "post",
    json: input,
  });
}

export function deleteOptionValue(valueId: string): Promise<void> {
  return requestVoid(`option-values/${valueId}`, { method: "delete" });
}
