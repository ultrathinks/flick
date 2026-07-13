"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import type { Booth } from "@/entities/booth";
import { useUpdateBooth } from "@/entities/booth";
import { ImagePicker, uploadImage } from "@/features/image-upload";
import { Button, Card, Field, Textarea, useToast } from "@/shared/ui";
import { StatusNote } from "./status-note.tsx";

export function BoothSettings({ booth }: { booth: Booth }) {
  const [name, setName] = useState(booth.name);
  const [description, setDescription] = useState(booth.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const update = useUpdateBooth();
  const toast = useToast();

  const dirty =
    name.trim() !== booth.name ||
    description.trim() !== (booth.description ?? "") ||
    file !== null;
  const valid = name.trim().length > 0;

  const save = async () => {
    if (file) {
      try {
        setUploading(true);
        await uploadImage({
          kind: "booth",
          targetId: booth.id,
          file,
        });
      } catch {
        setUploading(false);
        toast.error("이미지 업로드에 실패했어요.");
        return;
      }
      setUploading(false);
    }
    update.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFile(null);
          toast.success("부스 정보를 저장했어요.");
        },
        onError: () => toast.error("저장에 실패했어요."),
      },
    );
  };

  return (
    <div className="space-y-6">
      <StatusNote status={booth.status} />

      <Card className="max-w-xl space-y-5">
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
        <ImagePicker
          label="대표 이미지 (선택)"
          file={file}
          currentUrl={booth.imageUrl ?? null}
          onSelect={setFile}
          onClear={() => setFile(null)}
        />
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <Button
            loading={update.isPending || uploading}
            disabled={!dirty || !valid}
            onClick={save}
          >
            <Save className="size-4" />
            저장
          </Button>
          {update.isError && (
            <p className="text-body text-danger">저장에 실패했어요.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
