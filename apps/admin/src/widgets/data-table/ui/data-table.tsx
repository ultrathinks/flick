"use client";

import { Inbox } from "lucide-react";
import type { Key, ReactNode } from "react";
import { cn } from "@/shared/lib/cn.ts";
import { Button, Card, EmptyState, Skeleton } from "@/shared/ui";
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
  loadMoreError?: boolean;
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
  loadMoreError = false,
  toolbar,
}: DataTableProps<T>) {
  const showTable = isLoading || (!isError && rows.length > 0);

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <Card className="p-0 overflow-hidden">
        {showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-body">
              <thead>
                <tr className="border-b border-border">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "whitespace-nowrap px-4 py-2.5 text-caption font-medium text-foreground-subtle",
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
                        onKeyDown={
                          onRowClick
                            ? (event) => {
                                if (
                                  event.key === "Enter" ||
                                  event.key === " "
                                ) {
                                  event.preventDefault();
                                  onRowClick(row);
                                }
                              }
                            : undefined
                        }
                        role={onRowClick ? "button" : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
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
                              "whitespace-nowrap px-4 py-3 text-foreground tabular-nums",
                              column.align === "right" && "text-right",
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
          </div>
        ) : isError ? (
          <EmptyState
            icon={<Inbox />}
            title="불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요."
          />
        ) : (
          <EmptyState
            icon={<Inbox />}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </Card>

      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          {loadMoreError && (
            <p className="text-caption text-danger">
              더 불러오지 못했어요. 다시 시도해 주세요.
            </p>
          )}
          <Button
            variant="weak"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            loading={isFetchingMore}
          >
            {isFetchingMore ? "불러오는 중…" : "더 보기"}
          </Button>
        </div>
      )}
    </div>
  );
}
