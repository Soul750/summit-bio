"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useScroll } from "framer-motion";
import { SceneErrorBoundary } from "@/components/scene/SceneErrorBoundary";
import { StaticFallbackScene } from "@/components/scene/StaticFallbackScene";
import { Navigation } from "./Navigation";
import { HeroSection } from "./HeroSection";
import { BioSection } from "./BioSection";
import { WorkAndLinksSection } from "./WorkAndLinksSection";
import { Footer } from "./Footer";

const MountainSceneCanvas = dynamic(
  () => import("@/components/scene/MountainSceneCanvas"),
  {
    ssr: false,
    loading: () => <StaticFallbackScene />,
  }
);

export function SummitExperience() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [isStaticMode, setIsStaticMode] = useState(false);
  const scrollProgressRef = useRef<number>(0);

  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      scrollProgressRef.current = latest;
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div className="relative min-h-screen">
      {/* Persistent 3D Golden-Hour Mountain & Weeping Tree Backdrop */}
      <SceneErrorBoundary>
        <MountainSceneCanvas
          scrollProgressRef={scrollProgressRef}
          forceStatic={isStaticMode}
        />
      </SceneErrorBoundary>

      {/* Subtle Floating Navigation & Scroll Progress */}
      <Navigation
        scrollYProgress={scrollYProgress}
        isStaticMode={isStaticMode}
        onToggleStaticMode={() => setIsStaticMode((prev) => !prev)}
      />

      {/* Scroll-Choreographed Editorial Content */}
      <main className="relative z-10">
        <HeroSection
          scrollYProgress={scrollYProgress}
          reducedMotion={prefersReducedMotion}
        />
        <BioSection reducedMotion={prefersReducedMotion} />
        <WorkAndLinksSection reducedMotion={prefersReducedMotion} />
        <Footer />
      </main>
    </div>
  );
}
