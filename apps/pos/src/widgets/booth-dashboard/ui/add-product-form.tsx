"use client";

import { Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useCreateProduct, useUpdateProduct } from "@/entities/product";
import { uploadImage } from "@/features/image-upload";
import { Button, Field, Sheet, useToast } from "@/shared/ui";

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
  const toast = useToast();

  const priceValue = Number(price);
  const stockValue = unlimited ? null : Number(stock);
  const valid =
    name.trim().length > 0 &&
    Number.isInteger(priceValue) &&
    priceValue > 0 &&
    (unlimited ||
      (Number.isInteger(stockValue) && (stockValue as number) >= 0));

  const reset = () => {
    setName("");
    setPrice("");
    setStock("");
    setFile(null);
    setUnlimited(true);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        메뉴 추가
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="메뉴 추가">
        <div className="space-y-4">
          <Field
            label="메뉴 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 떡볶이"
          />
          <Field
            label="가격 (원)"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <label className="flex items-center gap-2 text-body text-foreground-subtle">
            <input
              type="checkbox"
              className="size-4 accent-brand"
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
          <div className="block">
            <span className="mb-1.5 block text-body font-medium text-foreground-muted">
              이미지 (선택)
            </span>
            <label className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-card-sm border border-dashed border-border bg-surface px-3 text-body text-foreground-subtle transition-colors hover:border-brand hover:text-foreground">
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
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1"
              loading={create.isPending || uploading}
              disabled={!valid}
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
                          toast.error("이미지 업로드에 실패했어요.");
                        } finally {
                          setUploading(false);
                        }
                      }
                      toast.success("메뉴를 추가했어요.");
                      reset();
                    },
                    onError: () => toast.error("메뉴 추가에 실패했어요."),
                  },
                )
              }
            >
              추가
            </Button>
            <Button variant="neutral" onClick={() => setOpen(false)}>
              취소
            </Button>
          </div>
          {create.isError && (
            <p className="text-body text-danger">메뉴 추가에 실패했어요.</p>
          )}
        </div>
      </Sheet>
    </>
  );
}
