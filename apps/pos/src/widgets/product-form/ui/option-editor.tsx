"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { cn } from "@/shared/lib/cn.ts";
import { Button, Field } from "@/shared/ui";
import {
  type DraftGroup,
  type DraftValue,
  newDraftGroup,
  newDraftValue,
  setGroupSelectType,
  toggleValueDefault,
} from "../model/option-draft.ts";
import { SwitchRow } from "./switch-row.tsx";

function ValueRow({
  value,
  onChange,
  onToggleDefault,
  onRemove,
  canRemove,
}: {
  value: DraftValue;
  onChange: (next: DraftValue) => void;
  onToggleDefault: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Field
        className="min-w-0 flex-1"
        value={value.name}
        placeholder="예: 곱빼기"
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <Field
        className="w-24 text-right"
        inputMode="numeric"
        value={value.priceDelta}
        placeholder="0"
        onChange={(e) => onChange({ ...value, priceDelta: e.target.value })}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={value.isDefault ? "기본 선택 해제" : "기본 선택으로 지정"}
        onClick={onToggleDefault}
      >
        <Star
          className={cn(
            "size-4",
            value.isDefault
              ? "fill-brand text-brand"
              : "text-foreground-subtle",
          )}
        />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="옵션값 삭제"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function GroupCard({
  group,
  onChange,
  onRemove,
}: {
  group: DraftGroup;
  onChange: (next: DraftGroup) => void;
  onRemove: () => void;
}) {
  const single = group.selectType === "single";

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="flex items-center gap-2 p-3">
        <Field
          className="min-w-0 flex-1"
          value={group.name}
          placeholder="예: 사이즈"
          onChange={(e) => onChange({ ...group, name: e.target.value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="옵션 그룹 삭제"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="divide-y divide-border border-t border-border px-3">
        <SwitchRow
          title="필수 선택"
          description="손님이 반드시 하나를 골라야 해요."
          checked={group.required}
          onChange={(required) => onChange({ ...group, required })}
        />
        <SwitchRow
          title="여러 개 선택"
          description="여러 옵션을 함께 고를 수 있어요."
          checked={!single}
          onChange={(multi) =>
            onChange(setGroupSelectType(group, multi ? "multi" : "single"))
          }
        />
        {!single && (
          <div className="py-3">
            <Field
              label="최대 선택 개수"
              inputMode="numeric"
              value={group.maxLimit}
              placeholder="제한 없음"
              help="비워두면 개수 제한 없이 고를 수 있어요."
              onChange={(e) => onChange({ ...group, maxLimit: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-3">
        <div className="flex items-center gap-2 px-1 text-caption font-medium text-foreground-subtle">
          <span className="flex-1">옵션값</span>
          <span className="w-24 text-right">추가금 (원)</span>
          <span className="w-9 text-center">기본</span>
          <span className="w-9" />
        </div>
        {group.values.map((value, valueIndex) => (
          <ValueRow
            key={value.key}
            value={value}
            canRemove={group.values.length > 1}
            onChange={(next) =>
              onChange({
                ...group,
                values: group.values.map((v, i) =>
                  i === valueIndex ? next : v,
                ),
              })
            }
            onToggleDefault={() =>
              onChange(toggleValueDefault(group, valueIndex))
            }
            onRemove={() =>
              onChange({
                ...group,
                values: group.values.filter((_, i) => i !== valueIndex),
              })
            }
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({ ...group, values: [...group.values, newDraftValue()] })
          }
        >
          <Plus className="size-4" />
          옵션값 추가
        </Button>
      </div>
    </div>
  );
}

export function OptionEditor({
  groups,
  onChange,
}: {
  groups: DraftGroup[];
  onChange: (next: DraftGroup[]) => void;
}) {
  return (
    <div className="space-y-3">
      {groups.length === 0 ? (
        <div className="rounded-card border border-dashed border-border px-4 py-8 text-center">
          <p className="text-body font-medium text-foreground">
            아직 추가한 옵션이 없어요
          </p>
          <p className="mt-1 text-caption text-foreground-subtle">
            사이즈나 맵기처럼 손님이 고를 선택지를 만들 수 있어요.
          </p>
        </div>
      ) : (
        groups.map((group, index) => (
          <GroupCard
            key={group.key}
            group={group}
            onChange={(next) =>
              onChange(groups.map((g, i) => (i === index ? next : g)))
            }
            onRemove={() => onChange(groups.filter((_, i) => i !== index))}
          />
        ))
      )}
      <Button
        type="button"
        variant="outline"
        block
        onClick={() => onChange([...groups, newDraftGroup()])}
      >
        <Plus className="size-4" />
        옵션 그룹 추가
      </Button>
    </div>
  );
}
