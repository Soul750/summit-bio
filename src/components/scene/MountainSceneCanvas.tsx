"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { SkyAndAtmosphere } from "./SkyAndAtmosphere";
import { MountainRange } from "./MountainRange";
import { WeepingTree } from "./WeepingTree";
import { ForegroundElements } from "./ForegroundElements";
import { DriftingParticles } from "./DriftingParticles";
import { CameraRig } from "./CameraRig";
import { StaticFallbackScene } from "./StaticFallbackScene";

interface MountainSceneCanvasProps {
  scrollProgressRef: React.RefObject<number>;
  forceStatic?: boolean;
}

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    return Boolean(gl);
  } catch {
    return false;
  }
}

function detectLowPower(): boolean {
  if (typeof window === "undefined") return false;
  const isSmallScreen = window.innerWidth < 768;
  const lowCores =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4;
  return isSmallScreen || lowCores;
}

export default function MountainSceneCanvas({
  scrollProgressRef,
  forceStatic = false,
}: MountainSceneCanvasProps) {
  const [webglAvailable] = useState<boolean>(() => checkWebGLSupport());
  const [lowPower] = useState<boolean>(() => detectLowPower());
  const [contextLost, setContextLost] = useState(false);

  if (forceStatic || contextLost || !webglAvailable) {
    return <StaticFallbackScene />;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none"
    >
      <Canvas
        dpr={lowPower ? [1, 1.25] : [1, 1.75]}
        camera={{ position: [-0.35, 1.38, 6.45], fov: 44, near: 0.1, far: 220 }}
        gl={{
          antialias: !lowPower,
          alpha: false,
          powerPreference: lowPower ? "low-power" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        onCreated={({ gl }) => {
          const dom = gl.domElement;
          const handleLost = (e: Event) => {
            e.preventDefault();
            setContextLost(true);
          };
          dom.addEventListener("webglcontextlost", handleLost, false);
        }}
      >
        <Suspense fallback={null}>
          <CameraRig scrollProgressRef={scrollProgressRef} />
          <SkyAndAtmosphere scrollProgressRef={scrollProgressRef} />
          <MountainRange
            scrollProgressRef={scrollProgressRef}
            lowPower={lowPower}
          />
          <WeepingTree
            scrollProgressRef={scrollProgressRef}
            lowPower={lowPower}
          />
          <ForegroundElements
            scrollProgressRef={scrollProgressRef}
            lowPower={lowPower}
          />
          <DriftingParticles
            scrollProgressRef={scrollProgressRef}
            lowPower={lowPower}
          />
        </Suspense>
      </Canvas>

      {/* Subtle atmospheric vignette for editorial legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, transparent 45%, rgba(8, 11, 18, 0.52) 100%)",
        }}
      />
    </div>
  );
}
