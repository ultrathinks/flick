import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/shared/ui";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Kiosk crashed:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
        <h1 className="text-title font-bold text-foreground">
          오류가 발생했어요
        </h1>
        <p className="mt-3 text-heading font-medium text-foreground-subtle">
          {error.message || "요청을 처리하는 중 문제가 생겼어요"}
        </p>
        <Button size="lg" className="mt-8" onClick={this.handleReset}>
          다시 시도
        </Button>
      </main>
    );
  }
}
