"use client";

import { useState } from "react";
import { useCreateBooth } from "@/entities/booth";
import { Button, Card, Field, Textarea } from "@/shared/ui";

export function BoothOnboarding() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateBooth();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <h1 className="mb-1.5 text-title font-bold tracking-tight text-foreground">
        부스 등록
      </h1>
      <p className="mb-5 text-body text-foreground-subtle">
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
        <Textarea
          label="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="부스 소개를 입력하세요"
        />
        <Button
          className="w-full"
          loading={create.isPending}
          disabled={!name.trim()}
          onClick={() =>
            create.mutate({
              name: name.trim(),
              description: description.trim() || undefined,
            })
          }
        >
          부스 등록
        </Button>
        {create.isError && (
          <p className="text-body text-danger">등록에 실패했어요.</p>
        )}
      </Card>
    </div>
  );
}
