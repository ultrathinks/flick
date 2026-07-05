"use client";

import { Save, Upload } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Booth } from "@/entities/booth";
import { useUpdateBooth } from "@/entities/booth";
import { uploadImage } from "@/features/image-upload";
import { Button, Card, Field, Textarea } from "@/shared/ui";
import { StatusNote } from "./status-note.tsx";

export function BoothSettings({ booth }: { booth: Booth }) {
  const [name, setName] = useState(booth.name);
  const [description, setDescription] = useState(booth.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const update = useUpdateBooth(booth.id);

  const dirty =
    name.trim() !== booth.name ||
    description.trim() !== (booth.description ?? "") ||
    file !== null;
  const valid = name.trim().length > 0;

  const save = async () => {
    let imageUrl: string | undefined;
    if (file) {
      try {
        setUploading(true);
        imageUrl = await uploadImage({
          kind: "booth",
          targetId: booth.id,
          file,
        });
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    update.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        ...(imageUrl ? { imageUrl } : {}),
      },
      { onSuccess: () => setFile(null) },
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          부스 설정
        </h1>
        <p className="mt-0.5 text-sm text-foreground-subtle">
          부스 정보를 관리하세요.
        </p>
      </div>

      <StatusNote status={booth.status} />

      <Card className="max-w-xl space-y-4">
        {booth.imageUrl && (
          <Image
            src={booth.imageUrl}
            alt={booth.name}
            width={640}
            height={160}
            unoptimized
            className="h-36 w-full rounded-[var(--radius-card-sm)] object-cover"
          />
        )}
        <Field
          label="부스 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="부스 소개를 입력하세요 (선택)"
        />
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-foreground">
            대표 이미지 (선택)
          </span>
          <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-card-sm)] border border-dashed border-border bg-surface px-3 text-sm text-foreground-subtle transition-colors hover:border-brand hover:text-foreground">
            <Upload className="size-4" />
            <span className="truncate">
              {file ? file.name : "이미지 파일 선택"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </label>
        <div className="flex items-center gap-3">
          <Button
            disabled={!dirty || !valid || update.isPending || uploading}
            onClick={save}
          >
            <Save className="size-4" />
            {update.isPending || uploading ? "저장 중…" : "저장"}
          </Button>
          {update.isError && (
            <p className="text-sm text-danger">저장에 실패했어요.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
