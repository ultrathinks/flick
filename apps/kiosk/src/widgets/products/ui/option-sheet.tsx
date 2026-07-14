import { useEffect, useMemo, useState } from "react";
import type { OptionGroup, Product } from "@/shared/api/types";
import { Button, Money, Sheet } from "@/shared/ui";

type OptionSheetProps = {
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, optionValueIds: string[]) => void;
};

function initialSelection(product: Product): Record<string, string[]> {
  const selection: Record<string, string[]> = {};
  for (const group of product.optionGroups) {
    const defaults = group.values
      .filter((value) => value.isDefault)
      .map((value) => value.id);
    if (group.maxSelect === 1 && defaults.length > 0) {
      selection[group.id] = [defaults[0] as string];
    } else if (defaults.length > 0) {
      selection[group.id] = defaults;
    } else {
      selection[group.id] = [];
    }
  }
  return selection;
}

function isSingle(group: OptionGroup) {
  return group.maxSelect === 1;
}

export function OptionSheet({ product, onClose, onConfirm }: OptionSheetProps) {
  const [selection, setSelection] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (product) {
      setSelection(initialSelection(product));
    }
  }, [product]);

  const priceDelta = useMemo(() => {
    if (!product) {
      return 0;
    }
    let sum = 0;
    for (const group of product.optionGroups) {
      const selected = selection[group.id] ?? [];
      for (const value of group.values) {
        if (selected.includes(value.id)) {
          sum += value.priceDelta;
        }
      }
    }
    return sum;
  }, [product, selection]);

  if (!product) {
    return null;
  }

  const toggleValue = (group: OptionGroup, valueId: string) => {
    setSelection((prev) => {
      const current = prev[group.id] ?? [];
      if (isSingle(group)) {
        if (!group.required && current.includes(valueId)) {
          return { ...prev, [group.id]: [] };
        }
        return { ...prev, [group.id]: [valueId] };
      }
      if (current.includes(valueId)) {
        return {
          ...prev,
          [group.id]: current.filter((id) => id !== valueId),
        };
      }
      if (group.maxSelect !== null && current.length >= group.maxSelect) {
        return prev;
      }
      return { ...prev, [group.id]: [...current, valueId] };
    });
  };

  const allRequiredMet = product.optionGroups.every(
    (group) => !group.required || (selection[group.id] ?? []).length > 0,
  );

  const optionValueIds = product.optionGroups.flatMap(
    (group) => selection[group.id] ?? [],
  );

  return (
    <Sheet open onClose={onClose} title={product.name} className="sm:max-w-lg">
      <div className="space-y-6">
        {product.optionGroups.map((group) => {
          const selected = selection[group.id] ?? [];
          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-heading font-bold text-foreground">
                  {group.name}
                </h3>
                <span className="text-caption font-medium text-foreground-subtle">
                  {group.required ? "필수" : "선택"}
                  {isSingle(group)
                    ? " · 1개 선택"
                    : group.maxSelect !== null
                      ? ` · 최대 ${group.maxSelect}개`
                      : " · 여러 개 선택"}
                </span>
              </div>
              <div className="grid gap-2">
                {group.values.map((value) => {
                  const active = selected.includes(value.id);
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => toggleValue(group, value.id)}
                      className={`flex items-center justify-between rounded-card border px-4 py-3 text-left transition ${
                        active
                          ? "border-brand bg-brand-subtle"
                          : "border-border bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex size-5 items-center justify-center border ${
                            isSingle(group) ? "rounded-full" : "rounded-md"
                          } ${
                            active
                              ? "border-brand bg-brand"
                              : "border-border bg-surface"
                          }`}
                        >
                          {active ? (
                            <span
                              className={`bg-brand-foreground ${
                                isSingle(group)
                                  ? "size-2 rounded-full"
                                  : "size-2.5 rounded-sm"
                              }`}
                            />
                          ) : null}
                        </span>
                        <span className="text-heading font-medium text-foreground">
                          {value.name}
                        </span>
                      </span>
                      {value.priceDelta > 0 ? (
                        <span className="text-body font-semibold text-foreground-subtle">
                          +<Money amount={value.priceDelta} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button
            variant="neutral"
            size="lg"
            className="flex-1"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="lg"
            className="flex-[2]"
            disabled={!allRequiredMet}
            onClick={() => onConfirm(product, optionValueIds)}
          >
            <span className="flex items-center gap-2">
              담기
              <Money amount={product.price + priceDelta} />
            </span>
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
