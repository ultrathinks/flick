import { Button, EmptyState } from "@flick/ui";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Screen } from "./screen.tsx";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("app error boundary", error, info);
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <Screen className="items-center justify-center">
        <EmptyState
          emoji="⚠️"
          title="문제가 생겼어요"
          description="잠시 후 다시 시도하거나 도담 앱에서 플릭을 다시 열어주세요."
          action={
            <Button size="lg" onClick={this.reset}>
              다시 시도
            </Button>
          }
        />
      </Screen>
    );
  }
}
