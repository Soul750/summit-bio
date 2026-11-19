"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  MIST_FRAGMENT_SHADER,
  MIST_VERTEX_SHADER,
  MOUNTAIN_FRAGMENT_SHADER,
  MOUNTAIN_VERTEX_SHADER,
} from "./shaders";
import { fbm2D, ridgedFbm2D } from "./utils";

interface MountainRangeProps {
  scrollProgressRef: React.RefObject<number>;
  lowPower?: boolean;
}

const GOLDEN_FOG = new THREE.Color("#b87250");
const TWILIGHT_FOG = new THREE.Color("#29283a");
const GOLDEN_MIST = new THREE.Color("#df9a6b");
const TWILIGHT_MIST = new THREE.Color("#3b445e");

/**
 * Generates a sculpted alpine ridge mesh using ridged multifractal noise.
 */
function buildMountainGeometry(
  width: number,
  depth: number,
  segX: number,
  segZ: number,
  peakHeight: number,
  seedOffset: number,
  profile: "distant" | "midLeft" | "midRight" | "summit"
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const nx = x / (width * 0.5);
    const nz = z / (depth * 0.5);

    let y = 0;

    if (profile === "summit") {
      // Sculpted rocky promontory with a natural flat-ish crown near (0, 0) for the weeping tree
      const radial = Math.sqrt(nx * nx * 1.1 + nz * nz * 1.35);
      const crownFalloff = Math.max(0, 1 - Math.pow(radial, 1.85));
      const crags = ridgedFbm2D(x * 0.22 + 3.1, z * 0.22 + 1.7, 4) * 1.35;
      const micro = (fbm2D(x * 0.7, z * 0.7, 3) - 0.5) * 0.45;
      // Flatten the very center slightly so tree roots anchor cleanly
      const centerPlateau = Math.exp(-(x * x + z * z) * 0.28);
      y =
        crownFalloff * peakHeight -
        peakHeight +
        (crags * (1 - centerPlateau * 0.65) + micro) * crownFalloff;
      // Drop steep cliff away behind the summit (-z)
      if (z < -1.8) {
        y -= Math.pow(Math.abs(z + 1.8), 1.45) * 0.42;
      }
    } else if (profile === "distant") {
      // Sweeping jagged distant horizon range
      const ridgeEnv = Math.exp(-nz * nz * 3.4) * (1 - Math.pow(Math.abs(nx), 2.4) * 0.55);
      const sharp = ridgedFbm2D(x * 0.055 + seedOffset, z * 0.065 + seedOffset * 0.5, 5);
      const secondary = fbm2D(x * 0.14 + 7.2, z * 0.14 - 2.4, 3);
      // Carve a slight dramatic saddle near x = -4 so the golden sun peaks through
      const saddle = 1 - 0.34 * Math.exp(-Math.pow((x + 12) / 14, 2));
      y = (sharp * 0.78 + secondary * 0.22) * peakHeight * Math.max(0, ridgeEnv) * saddle;
    } else {
      // Midground flanking ridges (left / right)
      const ridgeEnv = Math.exp(-nz * nz * 2.5) * Math.exp(-nx * nx * 1.4);
      const sharp = ridgedFbm2D(x * 0.11 + seedOffset, z * 0.12 + 4.3, 4);
      y = sharp * peakHeight * ridgeEnv;
    }

    pos.setY(i, y);
  }

  geo.computeVertexNormals();
  return geo;
}

export function MountainRange({
  scrollProgressRef,
  lowPower = false,
}: MountainRangeProps) {
  const distantMatRef = useRef<THREE.ShaderMaterial>(null);
  const midMatRef = useRef<THREE.ShaderMaterial>(null);
  const summitMatRef = useRef<THREE.ShaderMaterial>(null);
  const mistMat1Ref = useRef<THREE.ShaderMaterial>(null);
  const mistMat2Ref = useRef<THREE.ShaderMaterial>(null);

  const geometries = useMemo(() => {
    const segScale = lowPower ? 0.65 : 1;
    return {
      summit: buildMountainGeometry(
        15,
        12,
        Math.round(52 * segScale),
        Math.round(44 * segScale),
        4.2,
        1.1,
        "summit"
      ),
      midLeft: buildMountainGeometry(
        34,
        22,
        Math.round(64 * segScale),
        Math.round(44 * segScale),
        11.5,
        5.7,
        "midLeft"
      ),
      midRight: buildMountainGeometry(
        36,
        24,
        Math.round(64 * segScale),
        Math.round(44 * segScale),
        10.2,
        12.4,
        "midRight"
      ),
      distant: buildMountainGeometry(
        120,
        42,
        Math.round(120 * segScale),
        Math.round(52 * segScale),
        24,
        21.8,
        "distant"
      ),
    };
  }, [lowPower]);

  const sharedSunDir = useMemo(
    () => new THREE.Vector3(-0.46, 0.21, -0.86).normalize(),
    []
  );

  const summitUniforms = useMemo(
    () => ({
      uSunDirection: { value: sharedSunDir.clone() },
      uRockColor: { value: new THREE.Color("#3a383c") },
      uShadowColor: { value: new THREE.Color("#141925") },
      uSnowColor: { value: new THREE.Color("#cbbca8") },
      uFogColor: { value: GOLDEN_FOG.clone() },
      uFogDensity: { value: 0.013 },
      uSnowLine: { value: 2.2 },
      uScroll: { value: 0 },
    }),
    [sharedSunDir]
  );

  const midUniforms = useMemo(
    () => ({
      uSunDirection: { value: sharedSunDir.clone() },
      uRockColor: { value: new THREE.Color("#343948") },
      uShadowColor: { value: new THREE.Color("#121724") },
      uSnowColor: { value: new THREE.Color("#d9c6b0") },
      uFogColor: { value: GOLDEN_FOG.clone() },
      uFogDensity: { value: 0.017 },
      uSnowLine: { value: 5.5 },
      uScroll: { value: 0 },
    }),
    [sharedSunDir]
  );

  const distantUniforms = useMemo(
    () => ({
      uSunDirection: { value: sharedSunDir.clone() },
      uRockColor: { value: new THREE.Color("#2e3547") },
      uShadowColor: { value: new THREE.Color("#131828") },
      uSnowColor: { value: new THREE.Color("#e8ccb2") },
      uFogColor: { value: GOLDEN_FOG.clone() },
      uFogDensity: { value: 0.0155 },
      uSnowLine: { value: 10.5 },
      uScroll: { value: 0 },
    }),
    [sharedSunDir]
  );

  const mistUniforms1 = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMistColor: { value: GOLDEN_MIST.clone() },
      uOpacity: { value: 0.28 },
    }),
    []
  );

  const mistUniforms2 = useMemo(
    () => ({
      uTime: { value: 12 },
      uScroll: { value: 0 },
      uMistColor: { value: GOLDEN_MIST.clone() },
      uOpacity: { value: 0.22 },
    }),
    []
  );

  useFrame((_, delta) => {
    const scroll = scrollProgressRef.current ?? 0;
    const sunElev = THREE.MathUtils.lerp(0.21, 0.045, scroll);
    const sunAzimX = THREE.MathUtils.lerp(-0.46, -0.58, scroll);
    sharedSunDir.set(sunAzimX, sunElev, -0.86).normalize();

    const mats = [summitMatRef.current, midMatRef.current, distantMatRef.current];
    for (const mat of mats) {
      if (!mat) continue;
      mat.uniforms.uSunDirection.value.copy(sharedSunDir);
      mat.uniforms.uScroll.value = scroll;
      mat.uniforms.uFogColor.value.lerpColors(GOLDEN_FOG, TWILIGHT_FOG, scroll);
    }

    const dt = Math.min(delta, 0.05);
    if (mistMat1Ref.current) {
      mistMat1Ref.current.uniforms.uTime.value += dt;
      mistMat1Ref.current.uniforms.uScroll.value = scroll;
      mistMat1Ref.current.uniforms.uMistColor.value.lerpColors(
        GOLDEN_MIST,
        TWILIGHT_MIST,
        scroll
      );
      mistMat1Ref.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        0.3,
        0.2,
        scroll
      );
    }
    if (mistMat2Ref.current) {
      mistMat2Ref.current.uniforms.uTime.value += dt * 0.8;
      mistMat2Ref.current.uniforms.uScroll.value = scroll;
      mistMat2Ref.current.uniforms.uMistColor.value.lerpColors(
        GOLDEN_MIST,
        TWILIGHT_MIST,
        scroll
      );
    }
  });

  return (
    <group>
      {/* Hero Summit Promontory (anchored around y = -0.35 so tree roots sit naturally) */}
      <mesh geometry={geometries.summit} position={[0.4, -0.35, -1.6]}>
        <shaderMaterial
          ref={summitMatRef}
          vertexShader={MOUNTAIN_VERTEX_SHADER}
          fragmentShader={MOUNTAIN_FRAGMENT_SHADER}
          uniforms={summitUniforms}
        />
      </mesh>

      {/* Midground Flanking Alpine Ridges */}
      <mesh geometry={geometries.midLeft} position={[-15.5, -7.2, -17.5]} rotation={[0, 0.24, 0]}>
        <shaderMaterial
          ref={midMatRef}
          vertexShader={MOUNTAIN_VERTEX_SHADER}
          fragmentShader={MOUNTAIN_FRAGMENT_SHADER}
          uniforms={midUniforms}
        />
      </mesh>

      <mesh geometry={geometries.midRight} position={[16.5, -6.8, -19.5]} rotation={[0, -0.28, 0]}>
        <shaderMaterial
          vertexShader={MOUNTAIN_VERTEX_SHADER}
          fragmentShader={MOUNTAIN_FRAGMENT_SHADER}
          uniforms={midUniforms}
        />
      </mesh>

      {/* Distant Jagged Alpine Horizon Range */}
      <mesh geometry={geometries.distant} position={[0, -10.5, -48]}>
        <shaderMaterial
          ref={distantMatRef}
          vertexShader={MOUNTAIN_VERTEX_SHADER}
          fragmentShader={MOUNTAIN_FRAGMENT_SHADER}
          uniforms={distantUniforms}
        />
      </mesh>

      {/* Drifting Valley Mist Layers */}
      <mesh position={[-2, -3.2, -16]} rotation={[-Math.PI / 2.25, 0, 0.06]}>
        <planeGeometry args={[52, 22]} />
        <shaderMaterial
          ref={mistMat1Ref}
          vertexShader={MIST_VERTEX_SHADER}
          fragmentShader={MIST_FRAGMENT_SHADER}
          uniforms={mistUniforms1}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh position={[4, -5.2, -30]} rotation={[-Math.PI / 2.15, 0, -0.05]}>
        <planeGeometry args={[76, 26]} />
        <shaderMaterial
          ref={mistMat2Ref}
          vertexShader={MIST_VERTEX_SHADER}
          fragmentShader={MIST_FRAGMENT_SHADER}
          uniforms={mistUniforms2}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
