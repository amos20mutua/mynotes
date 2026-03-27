"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type GraphErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type GraphErrorBoundaryState = {
  hasError: boolean;
};

export class GraphErrorBoundary extends Component<GraphErrorBoundaryProps, GraphErrorBoundaryState> {
  state: GraphErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Graph rendering failed", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 text-slate-300">
            The graph renderer failed to load. Reload the page to retry.
          </div>
        )
      );
    }

    return this.props.children;
  }
}
