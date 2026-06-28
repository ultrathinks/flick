"use client";

import { useState } from "react";
import { useCreateProduct, useUpdateProduct } from "@/entities/product";
import { uploadImage } from "@/features/image-upload";
import { Button, Card, Field } from "@/shared/ui";

export function AddProductForm({ boothId }: { boothId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unlimited, setUnlimited] = useState(true);
  const [stock, setStock] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const create = useCreateProduct(boothId);
  const update = useUpdateProduct(boothId);

  const priceValue = Number(price);
  const stockValue = unlimited ? null : Number(stock);
  const valid =
    name.trim().length > 0 &&
    Number.isInteger(priceValue) &&
    priceValue > 0 &&
    (unlimited ||
      (Number.isInteger(stockValue) && (stockValue as number) >= 0));

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        + 메뉴 추가
      </Button>
    );
  }

  return (
    <Card className="space-y-4">
      <Field
        label="메뉴 이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Field
        label="가격 (원)"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={unlimited}
          onChange={(e) => setUnlimited(e.target.checked)}
        />
        재고 무제한 (품절은 직접 관리)
      </label>
      {!unlimited && (
        <Field
          label="재고 수량"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-600">
          이미지 (선택)
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="text-sm text-zinc-500"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!valid || create.isPending || uploading}
          onClick={() =>
            create.mutate(
              {
                name: name.trim(),
                price: priceValue,
                stock: stockValue,
              },
              {
                onSuccess: async (product) => {
                  if (file) {
                    try {
                      setUploading(true);
                      const imageUrl = await uploadImage({
                        kind: "product",
                        targetId: product.id,
                        file,
                      });
                      await update.mutateAsync({
                        id: product.id,
                        input: { imageUrl },
                      });
                    } catch {
                    } finally {
                      setUploading(false);
                    }
                  }
                  setName("");
                  setPrice("");
                  setStock("");
                  setFile(null);
                  setUnlimited(true);
                  setOpen(false);
                },
              },
            )
          }
        >
          {create.isPending || uploading ? "추가 중…" : "추가"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
    </Card>
  );
}
