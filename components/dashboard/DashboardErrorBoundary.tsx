"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Panel } from "./ui";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[dashboard-error]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Panel title="Something went wrong">
          <p className="text-sm text-red-300">{this.state.error.message}</p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Reload page
          </button>
        </Panel>
      );
    }
    return this.props.children;
  }
}
