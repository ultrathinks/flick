"use client";

import { useState } from "react";
import { useCreateBooth } from "@/entities/booth";
import { Button, Card, Field } from "@/shared/ui";

export function BoothOnboarding() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateBooth();

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="mb-2 text-2xl font-bold">부스 등록</h1>
      <p className="mb-6 text-sm text-zinc-500">
        먼저 부스를 등록하세요. 등록 후 관리자 승인을 받아야 판매를 시작할 수
        있어요.
      </p>
      <Card className="space-y-4">
        <Field
          label="부스 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 떡볶이 가게"
        />
        <Field
          label="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button
          className="w-full"
          disabled={!name.trim() || create.isPending}
          onClick={() =>
            create.mutate({
              name: name.trim(),
              description: description.trim() || undefined,
            })
          }
        >
          {create.isPending ? "등록 중…" : "부스 등록"}
        </Button>
        {create.isError && (
          <p className="text-sm text-red-600">등록에 실패했어요.</p>
        )}
      </Card>
    </div>
  );
}
