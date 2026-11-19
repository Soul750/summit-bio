"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
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

/**
 * Builds a dense 9-blade tapered alpine grass clump BufferGeometry so each
 * instanced tuft renders rich, natural meadow coverage at minimal GPU cost.
 */
function createGrassTuftGeometry(): THREE.BufferGeometry {
  const blades = [
    { offsetX: 0, offsetZ: 0, rotY: 0.1, tilt: 0.12, height: 0.68, width: 0.07 },
    { offsetX: -0.05, offsetZ: 0.03, rotY: 0.85, tilt: 0.25, height: 0.58, width: 0.062 },
    { offsetX: 0.05, offsetZ: -0.03, rotY: 1.65, tilt: 0.22, height: 0.62, width: 0.064 },
    { offsetX: -0.04, offsetZ: -0.05, rotY: 2.45, tilt: 0.28, height: 0.54, width: 0.058 },
    { offsetX: 0.04, offsetZ: 0.05, rotY: 3.25, tilt: 0.24, height: 0.56, width: 0.06 },
    { offsetX: -0.07, offsetZ: 0.01, rotY: 4.05, tilt: 0.32, height: 0.48, width: 0.055 },
    { offsetX: 0.07, offsetZ: -0.01, rotY: 4.85, tilt: 0.3, height: 0.5, width: 0.056 },
    { offsetX: 0.01, offsetZ: -0.07, rotY: 5.55, tilt: 0.27, height: 0.52, width: 0.058 },
    { offsetX: -0.01, offsetZ: 0.07, rotY: 2.05, tilt: 0.26, height: 0.55, width: 0.058 },
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vOffset = 0;

  for (const b of blades) {
    const cosY = Math.cos(b.rotY);
    const sinY = Math.sin(b.rotY);
    const hw = b.width * 0.5;
    const tipLean = Math.sin(b.tilt) * b.height;

    const pts = [
      [-hw, 0, 0],
      [hw, 0, 0],
      [-hw * 0.45, b.height * 0.52, tipLean * 0.35],
      [hw * 0.45, b.height * 0.52, tipLean * 0.35],
      [0, b.height, tipLean],
    ];

    for (const [lx, ly, lz] of pts) {
      const wx = b.offsetX + lx * cosY - lz * sinY;
      const wz = b.offsetZ + lx * sinY + lz * cosY;
      positions.push(wx, ly, wz);
      normals.push(sinY * 0.3, 0.9, cosY * 0.3);
    }

    indices.push(vOffset + 0, vOffset + 1, vOffset + 2);
    indices.push(vOffset + 1, vOffset + 3, vOffset + 2);
    indices.push(vOffset + 2, vOffset + 3, vOffset + 4);
    vOffset += 5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
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

  const grassTuftGeo = useMemo(() => createGrassTuftGeometry(), []);

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

  // Blanket the area beneath the weeping tree, the summit slopes, and the surrounding mountains in lush grass
  const { summitGrass, ridgeGrass, fallenLeaves } = useMemo(() => {
    const rand = createSeededRandom(9241);

    const sGrass: SlopeTuft[] = [];

    // 1a. Thick meadow carpet directly beneath the weeping tree and around its roots
    const underTreeCount = lowPower ? 240 : 620;
    for (let i = 0; i < underTreeCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 0.02 + Math.pow(rand(), 0.78) * 2.35;
      const lx = Math.cos(angle) * dist;
      const lz = Math.sin(angle) * dist * 0.92;
      const ly = evaluateMountainHeight(lx, lz, 15, 12, 4.2, 1.1, "summit");

      sGrass.push({
        x: lx + 0.4,
        y: ly - 0.35 - 0.03,
        z: lz - 1.6,
        scaleX: 1.05 + rand() * 0.85,
        scaleY: 0.78 + rand() * 1.05,
        rotY: rand() * Math.PI * 2,
        phase: rand() * Math.PI * 2,
        tiltX: (rand() - 0.5) * 0.18,
        tiltZ: (rand() - 0.5) * 0.18,
      });
    }

    // 1b. Dense grassy blanket across the entire summit mountain crown & slopes
    const sGrassCount = lowPower ? 480 : 1250;
    for (let i = 0; i < sGrassCount; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 0.5 + Math.pow(rand(), 0.62) * 6.0;
      const lx = Math.cos(angle) * dist;
      const lz = Math.sin(angle) * dist * 0.82;
      const ly = evaluateMountainHeight(lx, lz, 15, 12, 4.2, 1.1, "summit");

      if (ly > -3.1) {
        sGrass.push({
          x: lx + 0.4,
          y: ly - 0.35 - 0.03,
          z: lz - 1.6,
          scaleX: 1.15 + rand() * 1.05,
          scaleY: 0.85 + rand() * 1.25,
          rotY: rand() * Math.PI * 2,
          phase: rand() * Math.PI * 2,
          tiltX: (rand() - 0.5) * 0.24,
          tiltZ: (rand() - 0.5) * 0.24,
        });
      }
    }

    // 2. Abundant alpine grass tufts across the flanking mountains & distant mountain slopes
    const rGrass: SlopeTuft[] = [];

    const addRidgeTufts = (
      count: number,
      width: number,
      depth: number,
      peakHeight: number,
      seedOffset: number,
      profile: "midLeft" | "midRight" | "distant",
      pos: [number, number, number],
      rotY: number,
      minY: number,
      maxY: number,
      baseScale: number
    ) => {
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      for (let i = 0; i < count; i++) {
        const lx = (rand() - 0.5) * width * 0.88;
        const lz = (rand() - 0.5) * depth * 0.78;
        const ly = evaluateMountainHeight(
          lx,
          lz,
          width,
          depth,
          peakHeight,
          seedOffset,
          profile
        );

        if (ly > minY && ly < maxY) {
          const wx = pos[0] + lx * cosR + lz * sinR;
          const wz = pos[2] - lx * sinR + lz * cosR;
          const wy = pos[1] + ly - 0.06;
          rGrass.push({
            x: wx,
            y: wy,
            z: wz,
            scaleX: baseScale * (0.9 + rand() * 1.0),
            scaleY: baseScale * (0.85 + rand() * 1.2),
            rotY: rand() * Math.PI * 2,
            phase: rand() * Math.PI * 2,
            tiltX: (rand() - 0.5) * 0.28,
            tiltZ: (rand() - 0.5) * 0.28,
          });
        }
      }
    };

    const perMidCount = lowPower ? 420 : 1150;
    addRidgeTufts(
      perMidCount,
      34,
      22,
      11.5,
      5.7,
      "midLeft",
      [-15.5, -7.2, -17.5],
      0.24,
      0.15,
      8.8,
      2.85
    );
    addRidgeTufts(
      perMidCount,
      36,
      24,
      10.2,
      12.4,
      "midRight",
      [16.5, -6.8, -19.5],
      -0.28,
      0.15,
      8.2,
      2.85
    );
    addRidgeTufts(
      lowPower ? 460 : 1300,
      120,
      42,
      24,
      21.8,
      "distant",
      [0, -10.5, -48],
      0,
      0.4,
      14.5,
      5.6
    );

    // 3. Fallen willow leaves resting in the grass beneath the tree and across the summit
    const leafTotal = lowPower ? 110 : 240;
    const fLeaves: SlopeTuft[] = [];
    for (let i = 0; i < leafTotal; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = 0.08 + Math.pow(rand(), 0.72) * 4.5;
      const lx = Math.cos(angle) * dist;
      const lz = Math.sin(angle) * dist * 0.82;
      const ly = evaluateMountainHeight(lx, lz, 15, 12, 4.2, 1.1, "summit");

      if (ly > -2.2) {
        fLeaves.push({
          x: lx + 0.4,
          y: ly - 0.35 + 0.04,
          z: lz - 1.6,
          scaleX: 0.75 + rand() * 0.95,
          scaleY: 0.75 + rand() * 0.85,
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
      uGrassColor: { value: new THREE.Color("#435834") },
      uShadowColor: { value: new THREE.Color("#141925") },
      uSnowColor: { value: new THREE.Color("#cbbca8") },
      uFogColor: { value: GOLDEN_FOG.clone() },
      uFogDensity: { value: 0.013 },
      uSnowLine: { value: 2.8 },
      uGrassCoverage: { value: 0.98 },
      uScroll: { value: 0 },
    }),
    [sharedSunDir]
  );

  const midUniforms = useMemo(
    () => ({
      uSunDirection: { value: sharedSunDir.clone() },
      uRockColor: { value: new THREE.Color("#343948") },
      uGrassColor: { value: new THREE.Color("#394e31") },
      uShadowColor: { value: new THREE.Color("#121724") },
      uSnowColor: { value: new THREE.Color("#d9c6b0") },
      uFogColor: { value: GOLDEN_FOG.clone() },
      uFogDensity: { value: 0.017 },
      uSnowLine: { value: 7.4 },
      uGrassCoverage: { value: 0.92 },
      uScroll: { value: 0 },
    }),
    [sharedSunDir]
  );

  const distantUniforms = useMemo(
    () => ({
      uSunDirection: { value: sharedSunDir.clone() },
      uRockColor: { value: new THREE.Color("#2e3547") },
      uGrassColor: { value: new THREE.Color("#324734") },
      uShadowColor: { value: new THREE.Color("#131828") },
      uSnowColor: { value: new THREE.Color("#e8ccb2") },
      uFogColor: { value: GOLDEN_FOG.clone() },
      uFogDensity: { value: 0.0155 },
      uSnowLine: { value: 12.6 },
      uGrassCoverage: { value: 0.82 },
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

  useLayoutEffect(() => {
    if (!ridgeGrassRef.current) return;
    const obj = new THREE.Object3D();
    for (let i = 0; i < ridgeGrass.length; i++) {
      const g = ridgeGrass[i];
      obj.position.set(g.x, g.y, g.z);
      obj.rotation.set(g.tiltX, g.rotY, g.tiltZ);
      obj.scale.set(g.scaleX, g.scaleY, g.scaleX);
      obj.updateMatrix();
      ridgeGrassRef.current.setMatrixAt(i, obj.matrix);
    }
    ridgeGrassRef.current.instanceMatrix.needsUpdate = true;
  }, [ridgeGrass]);

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

    if (summitGrassRef.current) {
      for (let i = 0; i < summitGrass.length; i++) {
        const g = summitGrass[i];
        const sway = Math.sin(t * 1.85 + g.phase + scroll * 3.2) * 0.14;
        dummy.position.set(g.x, g.y, g.z);
        dummy.rotation.set(g.tiltX + sway * 0.35, g.rotY, g.tiltZ + sway);
        dummy.scale.set(g.scaleX, g.scaleY, g.scaleX);
        dummy.updateMatrix();
        summitGrassRef.current.setMatrixAt(i, dummy.matrix);
      }
      summitGrassRef.current.instanceMatrix.needsUpdate = true;
    }

    if (fallenLeavesRef.current) {
      for (let i = 0; i < fallenLeaves.length; i++) {
        const l = fallenLeaves[i];
        const flutter = Math.sin(t * 2.2 + l.phase + scroll * 4.0) * 0.08;
        dummy.position.set(l.x, l.y + Math.abs(flutter) * 0.14, l.z);
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
      {/* Hero Summit Promontory */}
      <mesh geometry={geometries.summit} position={[0.4, -0.35, -1.6]}>
        <shaderMaterial
          ref={summitMatRef}
          vertexShader={MOUNTAIN_VERTEX_SHADER}
          fragmentShader={MOUNTAIN_FRAGMENT_SHADER}
          uniforms={summitUniforms}
        />
      </mesh>

      {/* Lush Multi-Blade Grass Covering the Summit & Beneath the Weeping Tree */}
      {summitGrass.length > 0 && (
        <instancedMesh
          ref={summitGrassRef}
          args={[grassTuftGeo, undefined, summitGrass.length]}
        >
          <meshStandardMaterial
            color="#5a6f48"
            emissive="#2d3820"
            emissiveIntensity={0.22}
            roughness={0.84}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* Alpine Grass Covering the Flanking & Distant Mountain Slopes */}
      {ridgeGrass.length > 0 && (
        <instancedMesh
          ref={ridgeGrassRef}
          args={[grassTuftGeo, undefined, ridgeGrass.length]}
        >
          <meshStandardMaterial
            color="#435739"
            emissive="#1e2918"
            emissiveIntensity={0.18}
            roughness={0.88}
            side={THREE.DoubleSide}
          />
        </instancedMesh>
      )}

      {/* Fallen Willow Leaves beneath the Tree & across the Summit */}
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
