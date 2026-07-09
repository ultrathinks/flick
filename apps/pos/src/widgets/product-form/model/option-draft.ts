import type { OptionGroupInput, Product } from "@/entities/product";

export type DraftValue = {
  key: string;
  name: string;
  priceDelta: string;
  isDefault: boolean;
};

export type DraftGroup = {
  key: string;
  name: string;
  required: boolean;
  selectType: "single" | "multi";
  maxLimit: string;
  values: DraftValue[];
};

let counter = 0;
function nextKey(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function newDraftValue(): DraftValue {
  return { key: nextKey("value"), name: "", priceDelta: "", isDefault: false };
}

export function newDraftGroup(): DraftGroup {
  return {
    key: nextKey("group"),
    name: "",
    required: true,
    selectType: "single",
    maxLimit: "",
    values: [newDraftValue()],
  };
}

export function draftFromProduct(product: Product): DraftGroup[] {
  return product.optionGroups.map((group) => ({
    key: nextKey("group"),
    name: group.name,
    required: group.required,
    selectType: group.maxSelect === 1 ? "single" : "multi",
    maxLimit:
      group.maxSelect !== null && group.maxSelect > 1
        ? String(group.maxSelect)
        : "",
    values: group.values.map((value) => ({
      key: nextKey("value"),
      name: value.name,
      priceDelta: value.priceDelta > 0 ? String(value.priceDelta) : "",
      isDefault: value.isDefault,
    })),
  }));
}

export function setGroupSelectType(
  group: DraftGroup,
  selectType: "single" | "multi",
): DraftGroup {
  if (selectType === "single") {
    let defaultSeen = false;
    return {
      ...group,
      selectType: "single",
      maxLimit: "",
      values: group.values.map((value) => {
        if (value.isDefault && !defaultSeen) {
          defaultSeen = true;
          return value;
        }
        return value.isDefault ? { ...value, isDefault: false } : value;
      }),
    };
  }
  return { ...group, selectType: "multi" };
}

export function toggleValueDefault(
  group: DraftGroup,
  index: number,
): DraftGroup {
  const target = group.values[index];
  if (!target) {
    return group;
  }
  const nextDefault = !target.isDefault;
  return {
    ...group,
    values: group.values.map((value, i) => {
      if (i === index) {
        return { ...value, isDefault: nextDefault };
      }
      if (nextDefault && group.selectType === "single") {
        return value.isDefault ? { ...value, isDefault: false } : value;
      }
      return value;
    }),
  };
}

function cleanupGroups(groups: DraftGroup[]): DraftGroup[] {
  return groups.map((group) => ({
    ...group,
    values: group.values.filter(
      (value) => value.name.trim().length > 0 || value.priceDelta.trim(),
    ),
  }));
}

export function draftGroupsToInput(groups: DraftGroup[]): OptionGroupInput[] {
  return cleanupGroups(groups).map((group, groupIndex) => ({
    name: group.name.trim(),
    required: group.required,
    maxSelect:
      group.selectType === "single"
        ? 1
        : group.maxLimit.trim()
          ? Number(group.maxLimit)
          : null,
    sortOrder: groupIndex,
    values: group.values.map((value, valueIndex) => ({
      name: value.name.trim(),
      priceDelta: value.priceDelta.trim() ? Number(value.priceDelta) : 0,
      isDefault: value.isDefault,
      sortOrder: valueIndex,
    })),
  }));
}

export function isDraftGroupsValid(groups: DraftGroup[]): boolean {
  return cleanupGroups(groups).every((group) => {
    if (group.name.trim().length === 0) {
      return false;
    }
    if (group.values.length === 0) {
      return false;
    }
    if (group.selectType === "multi" && group.maxLimit.trim()) {
      const limit = Number(group.maxLimit);
      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > group.values.length
      ) {
        return false;
      }
    }
    return group.values.every((value) => {
      if (value.name.trim().length === 0) {
        return false;
      }
      if (value.priceDelta.trim()) {
        const delta = Number(value.priceDelta);
        if (!Number.isInteger(delta) || delta < 0) {
          return false;
        }
      }
      return true;
    });
  });
}
