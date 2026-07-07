"use client";

import { Inbox } from "lucide-react";
import type { Key, ReactNode } from "react";
import { cn } from "@/shared/lib/cn.ts";
import { Button, EmptyState, Skeleton } from "@/shared/ui";
import type { Column } from "../model/column.ts";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => Key;
  isLoading?: boolean;
  isError?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  toolbar?: ReactNode;
}

const SKELETON_ROWS = 6;

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  isError = false,
  emptyTitle = "표시할 항목이 없어요",
  emptyDescription,
  onRowClick,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  toolbar,
}: DataTableProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <table className="w-full border-collapse text-body">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-2.5 text-caption font-medium text-foreground-subtle",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows have no stable id
                  <tr key={rowIndex} className="border-b border-border">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border last:border-b-0",
                      onRowClick &&
                        "cursor-pointer transition-colors hover:bg-surface-muted",
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3 text-foreground",
                          column.align === "right" && "text-right tabular-nums",
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && isError && (
          <EmptyState
            icon={<Inbox />}
            title="불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요."
          />
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <EmptyState
            icon={<Inbox />}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? "불러오는 중…" : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}
