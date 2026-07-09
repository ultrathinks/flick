"use client";

import { ImageIcon, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui";

export function ImageField({
  file,
  currentUrl,
  onSelect,
  onClear,
}: {
  file: File | null;
  currentUrl: string | null;
  onSelect: (file: File | null) => void;
  onClear: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const preview = objectUrl ?? currentUrl;

  return (
    <div className="block">
      <span className="mb-1.5 block text-body font-medium text-foreground-muted">
        메뉴 사진
      </span>
      <div className="flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-card-sm border border-border bg-surface-muted">
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-foreground-faint">
              <ImageIcon className="size-6" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-card-sm border border-border bg-surface px-3 text-body font-medium text-foreground-subtle transition-colors hover:border-brand hover:text-foreground">
          <Upload className="size-4" />
          {preview ? "사진 변경" : "사진 추가"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
          />
        </label>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="선택한 사진 취소"
            onClick={onClear}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
