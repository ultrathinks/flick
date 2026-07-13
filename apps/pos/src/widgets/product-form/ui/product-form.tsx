"use client";

import { ChevronLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/entities/product";
import {
  useArchiveProduct,
  useCreateProduct,
  useUpdateProduct,
} from "@/entities/product";
import { ImagePicker, uploadImage } from "@/features/image-upload";
import {
  Button,
  Field,
  SectionHeader,
  useConfirm,
  useToast,
} from "@/shared/ui";
import {
  type DraftGroup,
  draftFromProduct,
  draftGroupsToInput,
  isDraftGroupsValid,
} from "../model/option-draft.ts";
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
  const [soldOut, setSoldOut] = useState(product?.status === "soldout");
  const [groups, setGroups] = useState<DraftGroup[]>(
    product ? draftFromProduct(product) : [],
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const create = useCreateProduct(boothId);
  const update = useUpdateProduct(boothId);
  const archive = useArchiveProduct(boothId);
  const confirm = useConfirm();
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
      (stock.trim() !== "" &&
        Number.isInteger(stockValue) &&
        (stockValue as number) >= 0)) &&
    isDraftGroupsValid(groups);

  const pending =
    create.isPending || update.isPending || archive.isPending || uploading;

  const back = () => router.push("/");

  const status: "available" | "soldout" | "hidden" = soldOut
    ? "soldout"
    : product?.status === "hidden"
      ? "hidden"
      : "available";

  const handleDelete = async () => {
    if (!product) return;
    const ok = await confirm({
      title: "이 메뉴를 삭제할까요?",
      description: `‘${product.name}’ 메뉴가 목록에서 완전히 사라져요.`,
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) return;
    archive.mutate(product.id, {
      onSuccess: () => {
        toast.success("메뉴를 삭제했어요.");
        back();
      },
      onError: () => toast.error("삭제에 실패했어요."),
    });
  };

  const handleSubmit = async () => {
    const base = {
      name: name.trim(),
      price: priceValue,
      stock: stockValue,
      status,
      options: draftGroupsToInput(groups),
    };

    if (product) {
      try {
        if (file) {
          setUploading(true);
          await uploadImage({
            kind: "product",
            targetId: product.id,
            file,
          });
        }
        await update.mutateAsync({ id: product.id, input: base });
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
        await uploadImage({
          kind: "product",
          targetId: created.id,
          file,
        });
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
    <div className="mx-auto w-full max-w-4xl">
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
            <ImagePicker
              label="메뉴 사진"
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

          <section className="space-y-3 border-t border-border pt-5">
            <SectionHeader
              title="판매 상태"
              description="품절로 표시하면 손님 화면에서 선택할 수 없어요."
            />
            <div className="divide-y divide-border">
              <SwitchRow
                title="품절"
                description="지금은 판매하지 않아요."
                checked={soldOut}
                onChange={setSoldOut}
              />
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

      <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
        {isEdit && (
          <Button
            variant="ghost"
            className="text-danger sm:mr-auto"
            disabled={pending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            메뉴 삭제
          </Button>
        )}
        <div className="flex gap-2 sm:ml-auto">
          <Button
            variant="neutral"
            block
            onClick={back}
            disabled={pending}
            className="sm:w-auto"
          >
            취소
          </Button>
          <Button
            block
            loading={pending}
            disabled={!valid}
            onClick={handleSubmit}
            className="sm:w-auto"
          >
            {isEdit ? "저장" : "등록"}
          </Button>
        </div>
      </div>
    </div>
  );
}
