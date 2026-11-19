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
import { createSeededRandom, fbm2D, ridgedFbm2D } from "./utils";

interface MountainRangeProps {
  scrollProgressRef: React.RefObject<number>;
  lowPower?: boolean;
}

const GOLDEN_FOG = new THREE.Color("#b87250");
const TWILIGHT_FOG = new THREE.Color("#29283a");
const GOLDEN_MIST = new THREE.Color("#df9a6b");
const TWILIGHT_MIST = new THREE.Color("#3b445e");

type MountainProfile = "distant" | "midLeft" | "midRight" | "summit";

function evaluateMountainHeight(
  x: number,
  z: number,
  width: number,
  depth: number,
  peakHeight: number,
  seedOffset: number,
  profile: MountainProfile
): number {
  const nx = x / (width * 0.5);
  const nz = z / (depth * 0.5);

  if (profile === "summit") {
    const radial = Math.sqrt(nx * nx * 1.1 + nz * nz * 1.35);
    const crownFalloff = Math.max(0, 1 - Math.pow(radial, 1.85));
    const crags = ridgedFbm2D(x * 0.22 + 3.1, z * 0.22 + 1.7, 4) * 1.35;
    const micro = (fbm2D(x * 0.7, z * 0.7, 3) - 0.5) * 0.45;
    const centerPlateau = Math.exp(-(x * x + z * z) * 0.28);
    let y =
      crownFalloff * peakHeight -
      peakHeight +
      (crags * (1 - centerPlateau * 0.65) + micro) * crownFalloff;
    if (z < -1.8) {
      y -= Math.pow(Math.abs(z + 1.8), 1.45) * 0.42;
    }
    return y;
  }

  if (profile === "distant") {
    const ridgeEnv =
      Math.exp(-nz * nz * 3.4) * (1 - Math.pow(Math.abs(nx), 2.4) * 0.55);
    const sharp = ridgedFbm2D(
      x * 0.055 + seedOffset,
      z * 0.065 + seedOffset * 0.5,
      5
    );
    const secondary = fbm2D(x * 0.14 + 7.2, z * 0.14 - 2.4, 3);
    const saddle = 1 - 0.34 * Math.exp(-Math.pow((x + 12) / 14, 2));
    return (
      (sharp * 0.78 + secondary * 0.22) *
      peakHeight *
      Math.max(0, ridgeEnv) *
      saddle
    );
  }

  const ridgeEnv = Math.exp(-nz * nz * 2.5) * Math.exp(-nx * nx * 1.4);
  const sharp = ridgedFbm2D(x * 0.11 + seedOffset, z * 0.12 + 4.3, 4);
  return sharp * peakHeight * ridgeEnv;
}

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
  profile: MountainProfile
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = evaluateMountainHeight(
      x,
      z,
      width,
      depth,
      peakHeight,
      seedOffset,
      profile
    );
    pos.setY(i, y);
  }

  geo.computeVertexNormals();
  return geo;
}

interface SlopeTuft {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  rotY: number;
  phase: number;
  tiltX: number;
  tiltZ: number;
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

  const summitGrassRef = useRef<THREE.InstancedMesh>(null);
  const ridgeGrassRef = useRef<THREE.InstancedMesh>(null);
  const fallenLeavesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

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

  // Populate alpine grass tufts and fallen golden leaves directly onto the mountain surfaces
  const { summitGrass, ridgeGrass, fallenLeaves } = useMemo(() => {
    const rand = createSeededRandom(9241);

    // 1. Summit promontory grass tufts (surrounding the weeping tree and ledges)
    const sGrassCount = lowPower ? 140 : 300;
    const sGrass: SlopeTuft[] = [];
    for (let i = 0; i < sGrassCount; i++) {
      // Cluster in organic patches across the summit crown & slopes
      const angle = rand() * Math.PI * 2;
      const dist = 0.55 + Math.pow(rand(), 0.72) * 4.8;
      const lx = Math.cos(angle) * dist;
      const lz = Math.sin(angle) * dist * 0.78;
      const ly = evaluateMountainHeight(lx, lz, 15, 12, 4.2, 1.1, "summit");

      if (ly > -2.3) {
        sGrass.push({
          x: lx + 0.4,
          y: ly - 0.35 + 0.14,
          z: lz - 1.6,
          scaleX: 0.9 + rand() * 0.85,
          scaleY: 0.7 + rand() * 1.15,
          rotY: rand() * Math.PI * 2,
          phase: rand() * Math.PI * 2,
          tiltX: (rand() - 0.5) * 0.25,
          tiltZ: (rand() - 0.5) * 0.25,
        });
      }
    }

    // 2. Flanking mountain slope grass tufts on midLeft and midRight ridges
    const rGrassCount = lowPower ? 120 : 260;
    const rGrass: SlopeTuft[] = [];

    const addRidgeTufts = (
      count: number,
      width: number,
      depth: number,
      peakHeight: number,
      seedOffset: number,
      profile: "midLeft" | "midRight",
      pos: [number, number, number],
      rotY: number
    ) => {
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      for (let i = 0; i < count; i++) {
        const lx = (rand() - 0.5) * width * 0.72;
        const lz = (rand() - 0.5) * depth * 0.55;
        const ly = evaluateMountainHeight(
          lx,
          lz,
          width,
          depth,
          peakHeight,
          seedOffset,
          profile
        );

        // Grow grass on grassy alpine benches below the snowy peaks
        if (ly > 0.8 && ly < 6.4) {
          const wx = pos[0] + lx * cosR + lz * sinR;
          const wz = pos[2] - lx * sinR + lz * cosR;
          const wy = pos[1] + ly + 0.18;
          rGrass.push({
            x: wx,
            y: wy,
            z: wz,
            scaleX: 1.5 + rand() * 1.4,
            scaleY: 1.4 + rand() * 1.6,
            rotY: rand() * Math.PI * 2,
            phase: rand() * Math.PI * 2,
            tiltX: (rand() - 0.5) * 0.3,
            tiltZ: (rand() - 0.5) * 0.3,
          });
        }
      }
    };

    addRidgeTufts(
      Math.floor(rGrassCount / 2),
      34,
      22,
      11.5,
      5.7,
      "midLeft",
      [-15.5, -7.2, -17.5],
      0.24
    );
    addRidgeTufts(
      Math.floor(rGrassCount / 2),
      36,
      24,
      10.2,
      12.4,
      "midRight",
      [16.5, -6.8, -19.5],
      -0.28
    );

    // 3. Fallen weeping leaves & alpine leaf litter resting across the summit & ridge ledges
    const leafTotal = lowPower ? 80 : 180;
    const fLeaves: SlopeTuft[] = [];
    for (let i = 0; i < leafTotal; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 0.25 + Math.pow(rand(), 0.65) * 4.4;
      const lx = Math.cos(angle) * dist;
      const lz = Math.sin(angle) * dist * 0.8;
      const ly = evaluateMountainHeight(lx, lz, 15, 12, 4.2, 1.1, "summit");

      if (ly > -2.0) {
        fLeaves.push({
          x: lx + 0.4,
          y: ly - 0.35 + 0.03,
          z: lz - 1.6,
          scaleX: 0.7 + rand() * 0.9,
          scaleY: 0.7 + rand() * 0.8,
          rotY: rand() * Math.PI * 2,
          phase: rand() * Math.PI * 2,
          tiltX: (rand() - 0.5) * 0.45,
          tiltZ: (rand() - 0.5) * 0.45,
        });
      }
    }

    return { summitGrass: sGrass, ridgeGrass: rGrass, fallenLeaves: fLeaves };
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
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;

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

    // Sway summit mountain grass tufts in the alpine wind
    if (summitGrassRef.current) {
      for (let i = 0; i < summitGrass.length; i++) {
        const g = summitGrass[i];
        const sway = Math.sin(t * 1.85 + g.phase + scroll * 3.2) * 0.16;
        dummy.position.set(g.x, g.y, g.z);
        dummy.rotation.set(g.tiltX + sway * 0.35, g.rotY, g.tiltZ + sway);
        dummy.scale.set(g.scaleX, g.scaleY, g.scaleX);
        dummy.updateMatrix();
        summitGrassRef.current.setMatrixAt(i, dummy.matrix);
      }
      summitGrassRef.current.instanceMatrix.needsUpdate = true;
    }

    // Sway distant flanking ridge grass patches
    if (ridgeGrassRef.current) {
      for (let i = 0; i < ridgeGrass.length; i++) {
        const g = ridgeGrass[i];
        const sway = Math.sin(t * 1.4 + g.phase + scroll * 2.5) * 0.12;
        dummy.position.set(g.x, g.y, g.z);
        dummy.rotation.set(g.tiltX, g.rotY, g.tiltZ + sway);
        dummy.scale.set(g.scaleX, g.scaleY, g.scaleX);
        dummy.updateMatrix();
        ridgeGrassRef.current.setMatrixAt(i, dummy.matrix);
      }
      ridgeGrassRef.current.instanceMatrix.needsUpdate = true;
    }

    // Rest & subtly flutter fallen leaves on the summit rock & grass
    if (fallenLeavesRef.current) {
      for (let i = 0; i < fallenLeaves.length; i++) {
        const l = fallenLeaves[i];
        const flutter = Math.sin(t * 2.2 + l.phase + scroll * 4.0) * 0.08;
        dummy.position.set(l.x, l.y + Math.abs(flutter) * 0.15, l.z);
        dummy.rotation.set(
          Math.PI / 2 + l.tiltX + flutter,
          l.rotY,
          l.tiltZ + flutter * 0.8
        );
        dummy.scale.set(0.085 * l.scaleX, 0.032 * l.scaleY, 0.02);
        dummy.updateMatrix();
        fallenLeavesRef.current.setMatrixAt(i, dummy.matrix);
      }
      fallenLeavesRef.current.instanceMatrix.needsUpdate = true;
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

      {/* Summit Alpine Grass Tufts */}
      {summitGrass.length > 0 && (
        <instancedMesh
          ref={summitGrassRef}
          args={[undefined, undefined, summitGrass.length]}
        >
          <coneGeometry args={[0.034, 0.42, 3]} />
          <meshStandardMaterial
            color="#556847"
            emissive="#2b331f"
            emissiveIntensity={0.2}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* Flanking Mountain Slope Grass Clusters */}
      {ridgeGrass.length > 0 && (
        <instancedMesh
          ref={ridgeGrassRef}
          args={[undefined, undefined, ridgeGrass.length]}
        >
          <coneGeometry args={[0.06, 0.55, 3]} />
          <meshStandardMaterial
            color="#3d4d3a"
            roughness={0.9}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* Fallen Golden-Amber & Olive Leaves scattered across the Summit Mountain */}
      {fallenLeaves.length > 0 && (
        <instancedMesh
          ref={fallenLeavesRef}
          args={[undefined, undefined, fallenLeaves.length]}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#b57a45"
            emissive="#633c1c"
            emissiveIntensity={0.22}
            roughness={0.78}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* Midground Flanking Alpine Ridges */}
      <mesh
        geometry={geometries.midLeft}
        position={[-15.5, -7.2, -17.5]}
        rotation={[0, 0.24, 0]}
      >
        <shaderMaterial
          ref={midMatRef}
          vertexShader={MOUNTAIN_VERTEX_SHADER}
          fragmentShader={MOUNTAIN_FRAGMENT_SHADER}
          uniforms={midUniforms}
        />
      </mesh>

      <mesh
        geometry={geometries.midRight}
        position={[16.5, -6.8, -19.5]}
        rotation={[0, -0.28, 0]}
      >
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
