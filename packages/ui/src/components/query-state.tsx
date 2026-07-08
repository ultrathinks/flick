import type { ReactNode } from "react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Loader } from "./loader";

interface QueryStateProps {
  isPending: boolean;
  isError: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  loading?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyEmoji?: string;
  empty?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  children: ReactNode;
}

export function QueryState({
  isPending,
  isError,
  isEmpty = false,
  onRetry,
  loading,
  emptyTitle = "표시할 내용이 없어요",
  emptyDescription,
  emptyEmoji,
  empty,
  errorTitle = "불러오지 못했어요",
  errorDescription = "잠시 후 다시 시도해 주세요.",
  children,
}: QueryStateProps) {
  if (isPending) {
    return (
      loading ?? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      )
    );
  }

  if (isError) {
    return (
      <EmptyState
        emoji="⚠️"
        title={errorTitle}
        description={errorDescription}
        action={
          onRetry ? (
            <Button variant="weak" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (isEmpty) {
    return (
      empty ?? (
        <EmptyState
          emoji={emptyEmoji}
          title={emptyTitle}
          description={emptyDescription}
        />
      )
    );
  }

  return <>{children}</>;
}
