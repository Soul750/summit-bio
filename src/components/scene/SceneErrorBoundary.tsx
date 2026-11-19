"use client";

import React from "react";
import { StaticFallbackScene } from "./StaticFallbackScene";

interface SceneErrorBoundaryProps {
  children: React.ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
}

export class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("3D Summit scene fallback activated:", error.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return <StaticFallbackScene />;
    }
    return this.props.children;
  }
}
