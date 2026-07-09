"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/entities/product";
import { useCreateProduct, useUpdateProduct } from "@/entities/product";
import { uploadImage } from "@/features/image-upload";
import { Button, Field, SectionHeader, useToast } from "@/shared/ui";
import {
  type DraftGroup,
  draftFromProduct,
  draftGroupsToInput,
  isDraftGroupsValid,
} from "../model/option-draft.ts";
import { ImageField } from "./image-field.tsx";
import { OptionEditor } from "./option-editor.tsx";
import { SwitchRow } from "./switch-row.tsx";

const MAX_PRICE = 3000;

export function ProductForm({
  boothId,
  product,
}: {
  boothId: string;
  product?: Product;
}) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [tracked, setTracked] = useState(
    product ? product.stock !== null : false,
  );
  const [stock, setStock] = useState(
    product && product.stock !== null ? String(product.stock) : "",
  );
  const [groups, setGroups] = useState<DraftGroup[]>(
    product ? draftFromProduct(product) : [],
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const create = useCreateProduct(boothId);
  const update = useUpdateProduct(boothId);
  const toast = useToast();

  const priceValue = Number(price);
  const stockValue = tracked ? Number(stock) : null;
  const priceTooHigh = price.trim() !== "" && priceValue > MAX_PRICE;
  const valid =
    name.trim().length > 0 &&
    Number.isInteger(priceValue) &&
    priceValue > 0 &&
    priceValue <= MAX_PRICE &&
    (!tracked ||
      (Number.isInteger(stockValue) && (stockValue as number) >= 0)) &&
    isDraftGroupsValid(groups);

  const pending = create.isPending || update.isPending || uploading;

  const back = () => router.push("/");

  const handleSubmit = async () => {
    const base = {
      name: name.trim(),
      price: priceValue,
      stock: stockValue,
      options: draftGroupsToInput(groups),
    };

    if (product) {
      try {
        let imageUrl: string | undefined;
        if (file) {
          setUploading(true);
          imageUrl = await uploadImage({
            kind: "product",
            targetId: product.id,
            file,
          });
        }
        await update.mutateAsync({
          id: product.id,
          input: imageUrl ? { ...base, imageUrl } : base,
        });
        toast.success("메뉴를 수정했어요.");
        back();
      } catch {
        toast.error("메뉴 수정에 실패했어요.");
      } finally {
        setUploading(false);
      }
      return;
    }

    let created: Product;
    try {
      created = await create.mutateAsync(base);
    } catch {
      toast.error("메뉴 추가에 실패했어요.");
      return;
    }

    if (file) {
      try {
        setUploading(true);
        const imageUrl = await uploadImage({
          kind: "product",
          targetId: created.id,
          file,
        });
        await update.mutateAsync({ id: created.id, input: { imageUrl } });
      } catch {
        toast.error(
          "메뉴는 추가했지만 사진 등록에 실패했어요. 수정에서 다시 시도해 주세요.",
        );
        back();
        return;
      } finally {
        setUploading(false);
      }
    }
    toast.success("메뉴를 추가했어요.");
    back();
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-24">
      <Link
        href="/"
        className="-mx-2 mb-3 inline-flex items-center gap-1 rounded-card-sm px-2 py-2 text-body text-foreground-subtle outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        메뉴 관리로
      </Link>
      <h1 className="mb-6 text-title font-bold tracking-tight text-foreground">
        {isEdit ? "메뉴 수정" : "메뉴 추가"}
      </h1>

      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        <div className="space-y-6">
          <section className="space-y-4">
            <SectionHeader title="기본 정보" />
            <Field
              required
              label="메뉴 이름"
              value={name}
              placeholder="예: 떡볶이"
              onChange={(e) => setName(e.target.value)}
            />
            <Field
              required
              label="가격"
              inputMode="numeric"
              value={price}
              placeholder="0"
              onChange={(e) => setPrice(e.target.value)}
              error={
                priceTooHigh
                  ? `기본 가격은 최대 ${MAX_PRICE.toLocaleString()}원까지 등록할 수 있어요.`
                  : undefined
              }
              help={`옵션 추가금은 별도이고, 기본 가격은 최대 ${MAX_PRICE.toLocaleString()}원이에요.`}
            />
            <ImageField
              file={file}
              currentUrl={product?.imageUrl ?? null}
              onSelect={setFile}
              onClear={() => setFile(null)}
            />
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <SectionHeader
              title="재고"
              description="재고를 정해두면 손님 화면에 남은 수량이 보이고, 소진되면 품절로 표시돼요."
            />
            <div className="divide-y divide-border">
              <SwitchRow
                title="재고 관리"
                description="남은 수량을 정해두고 판매해요."
                checked={tracked}
                onChange={setTracked}
              />
              {tracked && (
                <div className="py-3">
                  <Field
                    label="재고 수량"
                    inputMode="numeric"
                    value={stock}
                    placeholder="예: 50"
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="space-y-3 md:border-l md:border-border md:pl-10">
          <SectionHeader
            title="옵션"
            description="사이즈나 맵기처럼 손님이 고르는 선택지예요. 없어도 괜찮아요."
          />
          <OptionEditor groups={groups} onChange={setGroups} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 py-3 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl justify-end gap-2">
          <Button variant="neutral" onClick={back} disabled={pending}>
            취소
          </Button>
          <Button loading={pending} disabled={!valid} onClick={handleSubmit}>
            {isEdit ? "저장" : "등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}
