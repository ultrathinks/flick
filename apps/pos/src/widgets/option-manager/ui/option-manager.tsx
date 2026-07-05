"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import type { OptionGroup } from "@/entities/option";
import { useOptionMutations } from "@/entities/option";
import { Badge, Button, Card, Field } from "@/shared/ui";

function ValueRow({
  productId,
  id,
  name,
  priceDelta,
  isDefault,
}: {
  productId: string;
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
}) {
  const { removeValue } = useOptionMutations(productId);
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-foreground">
        {name}
        {priceDelta > 0 && (
          <span className="text-xs text-foreground-subtle">
            +{priceDelta.toLocaleString()}원
          </span>
        )}
        {isDefault && <Badge tone="brand">기본</Badge>}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="옵션값 삭제"
        onClick={() => removeValue.mutate(id)}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function AddValue({
  productId,
  groupId,
}: {
  productId: string;
  groupId: string;
}) {
  const { addValue } = useOptionMutations(productId);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const priceValue = price ? Number(price) : 0;
  const valid = name.trim().length > 0 && priceValue >= 0;

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2">
      <Field
        label="옵션값"
        className="w-28"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Field
        label="추가금"
        className="w-24"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <label className="flex items-center gap-1 pb-3 text-xs text-foreground-subtle">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        기본
      </label>
      <Button
        size="sm"
        className="mb-0.5"
        disabled={!valid || addValue.isPending}
        onClick={() =>
          addValue.mutate(
            { groupId, name: name.trim(), priceDelta: priceValue, isDefault },
            {
              onSuccess: () => {
                setName("");
                setPrice("");
                setIsDefault(false);
              },
            },
          )
        }
      >
        <Plus className="size-4" />
        추가
      </Button>
    </div>
  );
}

function GroupCard({
  productId,
  group,
}: {
  productId: string;
  group: OptionGroup;
}) {
  const { removeGroup } = useOptionMutations(productId);
  return (
    <Card className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {group.name}
          <Badge tone={group.required ? "brand" : "neutral"}>
            {group.required ? "필수" : "선택"}
          </Badge>
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeGroup.mutate(group.id)}
        >
          그룹 삭제
        </Button>
      </div>
      <div className="divide-y divide-border">
        {group.values.map((value) => (
          <ValueRow
            key={value.id}
            productId={productId}
            id={value.id}
            name={value.name}
            priceDelta={value.priceDelta}
            isDefault={value.isDefault}
          />
        ))}
      </div>
      <AddValue productId={productId} groupId={group.id} />
    </Card>
  );
}

function AddGroup({ productId }: { productId: string }) {
  const { addGroup } = useOptionMutations(productId);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(true);

  return (
    <Card className="flex flex-wrap items-end gap-2">
      <Field
        label="옵션 그룹"
        className="w-40"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="예: 사이즈"
      />
      <label className="flex items-center gap-1 pb-3 text-xs text-foreground-subtle">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        필수
      </label>
      <Button
        size="sm"
        className="mb-0.5"
        disabled={!name.trim() || addGroup.isPending}
        onClick={() =>
          addGroup.mutate(
            { name: name.trim(), required },
            { onSuccess: () => setName("") },
          )
        }
      >
        <Plus className="size-4" />
        그룹 추가
      </Button>
    </Card>
  );
}

export function OptionManager({
  productId,
  groups,
}: {
  productId: string;
  groups: OptionGroup[];
}) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <GroupCard key={group.id} productId={productId} group={group} />
      ))}
      <AddGroup productId={productId} />
    </div>
  );
}
