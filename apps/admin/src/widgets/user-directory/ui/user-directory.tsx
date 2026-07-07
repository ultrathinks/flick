"use client";

import { useMemo, useState } from "react";
import { type AdminUser, useUsers } from "@/entities/user";
import { Badge, formatWon, Input } from "@/shared/ui";
import { type Column, DataTable } from "@/widgets/data-table";

const columns: Column<AdminUser>[] = [
  { key: "name", header: "이름", cell: (u) => u.name },
  {
    key: "studentNumber",
    header: "학번",
    cell: (u) => u.studentNumber ?? "—",
  },
  {
    key: "balance",
    header: "잔액",
    align: "right",
    cell: (u) => formatWon(u.balance),
  },
  {
    key: "isAdmin",
    header: "권한",
    cell: (u) =>
      u.isAdmin ? (
        <Badge tone="brand">관리자</Badge>
      ) : (
        <Badge tone="neutral">일반</Badge>
      ),
  },
];

export function UserDirectory() {
  const [query, setQuery] = useState("");
  const users = useUsers(query);

  const rows = useMemo(
    () => users.data?.pages.flatMap((page) => page.items) ?? [],
    [users.data],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(u) => u.id}
      isLoading={users.isPending}
      isError={users.isError}
      emptyTitle="사용자가 없어요"
      emptyDescription={query ? "검색 결과가 없어요." : undefined}
      hasMore={users.hasNextPage}
      isFetchingMore={users.isFetchingNextPage}
      onLoadMore={() => users.fetchNextPage()}
      toolbar={
        <Input
          placeholder="이름 또는 학번으로 검색"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
      }
    />
  );
}
