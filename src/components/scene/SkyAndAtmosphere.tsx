"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SKY_FRAGMENT_SHADER, SKY_VERTEX_SHADER } from "./shaders";

interface SkyAndAtmosphereProps {
  scrollProgressRef: React.RefObject<number>;
}

const GOLDEN_SUN_COLOR = new THREE.Color("#ffbe78");
const TWILIGHT_SUN_COLOR = new THREE.Color("#c97358");
const GOLDEN_AMBIENT = new THREE.Color("#4a536b");
const TWILIGHT_AMBIENT = new THREE.Color("#1f283d");
const GOLDEN_GROUND = new THREE.Color("#29201c");
const TWILIGHT_GROUND = new THREE.Color("#0e131e");

export function SkyAndAtmosphere({ scrollProgressRef }: SkyAndAtmosphereProps) {
  const skyMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uSunDirection: { value: new THREE.Vector3(-0.46, 0.19, -0.87).normalize() },
    }),
    []
  );

  useFrame((state, delta) => {
    const scroll = scrollProgressRef.current ?? 0;

    // Sun sets gently lower toward the distant mountain ridge as the user scrolls
    const sunElev = THREE.MathUtils.lerp(0.21, 0.045, scroll);
    const sunAzimX = THREE.MathUtils.lerp(-0.46, -0.58, scroll);
    const sunDir = uniforms.uSunDirection.value;
    sunDir.set(sunAzimX, sunElev, -0.86).normalize();

    if (skyMaterialRef.current) {
      skyMaterialRef.current.uniforms.uTime.value += Math.min(delta, 0.05);
      skyMaterialRef.current.uniforms.uScroll.value = scroll;
    }

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunDir).multiplyScalar(42);
      sunLightRef.current.intensity = THREE.MathUtils.lerp(2.7, 1.05, scroll);
      sunLightRef.current.color.lerpColors(
        GOLDEN_SUN_COLOR,
        TWILIGHT_SUN_COLOR,
        scroll
      );
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.lerp(1.15, 0.55, scroll);
    }

    if (hemiLightRef.current) {
      hemiLightRef.current.color.lerpColors(
        GOLDEN_AMBIENT,
        TWILIGHT_AMBIENT,
        scroll
      );
      hemiLightRef.current.groundColor.lerpColors(
        GOLDEN_GROUND,
        TWILIGHT_GROUND,
        scroll
      );
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.95, 0.52, scroll);
    }

    // Keep WebGL clear color synced with deep twilight slate
    if (state.gl) {
      state.scene.background = null;
    }
  });

  return (
    <>
      {/* Procedural Atmospheric Sky Dome */}
      <mesh scale={[140, 140, 140]} frustumCulled={false}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          ref={skyMaterialRef}
          vertexShader={SKY_VERTEX_SHADER}
          fragmentShader={SKY_FRAGMENT_SHADER}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Primary Golden-Hour / Twilight Sun Directional Light */}
      <directionalLight
        ref={sunLightRef}
        position={[-18, 9, -34]}
        intensity={2.7}
        color="#ffbe78"
      />

      {/* Cool Alpine Sky Fill / Rim Light */}
      <directionalLight
        ref={rimLightRef}
        position={[16, 12, 14]}
        intensity={1.1}
        color="#89a6cc"
      />

      {/* Atmospheric Hemisphere Light */}
      <hemisphereLight
        ref={hemiLightRef}
        args={["#4a536b", "#29201c", 0.95]}
      />
    </>
  );
}
