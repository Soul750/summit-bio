"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  WEEPING_FOLIAGE_FRAGMENT_SHADER,
  WEEPING_FOLIAGE_VERTEX_SHADER,
} from "./shaders";
import { createSeededRandom } from "./utils";

interface WeepingTreeProps {
  scrollProgressRef: React.RefObject<number>;
  lowPower?: boolean;
}

/**
 * Builds a tapered cylindrical tube along a CatmullRomCurve3 so trunks and
 * branches thin organically from base to tip.
 */
function createTaperedBranchGeometry(
  points: THREE.Vector3[],
  radiusStart: number,
  radiusEnd: number,
  tubularSegments = 20,
  radialSegments = 8
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, P);
    N.copy(frames.normals[i]);
    B.copy(frames.binormals[i]);

    // Slight organic gnarl along the radius
    const radius = THREE.MathUtils.lerp(radiusStart, radiusEnd, Math.pow(t, 0.85));

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);

      normal.x = cos * N.x + sin * B.x;
      normal.y = cos * N.y + sin * B.y;
      normal.z = cos * N.z + sin * B.z;
      normal.normalize();

      vertex.x = P.x + radius * normal.x;
      vertex.y = P.y + radius * normal.y;
      vertex.z = P.z + radius * normal.z;

      vertices.push(vertex.x, vertex.y, vertex.z);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(j / radialSegments, t);
    }
  }

  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = (radialSegments + 1) * (i - 1) + (j - 1);
      const b = (radialSegments + 1) * i + (j - 1);
      const c = (radialSegments + 1) * i + j;
      const d = (radialSegments + 1) * (i - 1) + j;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

/**
 * Merges multiple non-indexed or indexed BufferGeometries that share
 * position/normal/uv attributes into a single draw call.
 */
function mergeSimpleGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const geo of geometries) {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const norm = geo.attributes.normal as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    const idx = geo.index;

    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
    }

    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        indices.push(idx.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        indices.push(i + vertexOffset);
      }
    }
    vertexOffset += pos.count;
    geo.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex(indices);
  return merged;
}

export function WeepingTree({
  scrollProgressRef,
  lowPower = false,
}: WeepingTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const foliageMatRef = useRef<THREE.ShaderMaterial>(null);

  const { woodGeometry, foliageGeometry } = useMemo(() => {
    const rand = createSeededRandom(4207);
    const branchGeos: THREE.BufferGeometry[] = [];
    const anchorPoints: THREE.Vector3[] = [];

    // Main gnarled wind-sculpted trunk leaning gently right toward the alpine wind
    const trunkCurve = [
      new THREE.Vector3(0, -0.35, 0),
      new THREE.Vector3(0.08, 0.75, 0.05),
      new THREE.Vector3(0.24, 1.75, -0.06),
      new THREE.Vector3(0.32, 2.65, -0.14),
      new THREE.Vector3(0.26, 3.25, -0.12),
    ];
    branchGeos.push(createTaperedBranchGeometry(trunkCurve, 0.28, 0.11, 22, 9));

    // Exposed alpine roots gripping the granite summit
    const rootDefs = [
      [
        new THREE.Vector3(0.0, 0.15, 0.0),
        new THREE.Vector3(-0.42, -0.12, 0.25),
        new THREE.Vector3(-0.88, -0.45, 0.45),
      ],
      [
        new THREE.Vector3(0.05, 0.12, 0.0),
        new THREE.Vector3(0.48, -0.1, 0.32),
        new THREE.Vector3(0.95, -0.46, 0.55),
      ],
      [
        new THREE.Vector3(0.0, 0.14, -0.04),
        new THREE.Vector3(-0.22, -0.1, -0.48),
        new THREE.Vector3(-0.55, -0.48, -0.88),
      ],
      [
        new THREE.Vector3(0.04, 0.12, -0.02),
        new THREE.Vector3(0.42, -0.14, -0.36),
        new THREE.Vector3(0.84, -0.48, -0.72),
      ],
    ];
    for (const r of rootDefs) {
      branchGeos.push(createTaperedBranchGeometry(r, 0.14, 0.03, 10, 6));
    }

    // 7 arching primary boughs radiating gracefully into a weeping umbrella silhouette
    const boughSpecs = [
      { angle: -0.25, reach: 2.35, rise: 1.05, drop: 0.2, startY: 2.85 },
      { angle: 0.65, reach: 2.15, rise: 0.95, drop: 0.15, startY: 2.95 },
      { angle: 1.55, reach: 2.0, rise: 1.1, drop: 0.18, startY: 3.1 },
      { angle: 2.45, reach: 2.25, rise: 0.9, drop: 0.22, startY: 2.75 },
      { angle: 3.35, reach: 2.45, rise: 0.85, drop: 0.25, startY: 2.6 },
      { angle: 4.35, reach: 2.05, rise: 1.0, drop: 0.15, startY: 3.05 },
      { angle: 5.3, reach: 1.9, rise: 1.15, drop: 0.12, startY: 3.18 },
    ];

    for (const spec of boughSpecs) {
      const dx = Math.cos(spec.angle);
      const dz = Math.sin(spec.angle);
      const origin = new THREE.Vector3(0.28, spec.startY, -0.12);
      const mid1 = new THREE.Vector3(
        origin.x + dx * spec.reach * 0.42,
        origin.y + spec.rise * 0.85,
        origin.z + dz * spec.reach * 0.42
      );
      const mid2 = new THREE.Vector3(
        origin.x + dx * spec.reach * 0.78,
        origin.y + spec.rise * 0.62,
        origin.z + dz * spec.reach * 0.78
      );
      const tip = new THREE.Vector3(
        origin.x + dx * spec.reach,
        origin.y + spec.rise * 0.18 - spec.drop,
        origin.z + dz * spec.reach
      );

      branchGeos.push(
        createTaperedBranchGeometry([origin, mid1, mid2, tip], 0.1, 0.022, 16, 6)
      );

      // Sample weeping foliage anchor points along the outer 75% of each bough
      const curve = new THREE.CatmullRomCurve3([origin, mid1, mid2, tip]);
      const samples = lowPower ? 7 : 12;
      for (let s = 0; s < samples; s++) {
        const t = 0.24 + (s / (samples - 1)) * 0.76;
        const p = curve.getPointAt(t);
        anchorPoints.push(
          new THREE.Vector3(
            p.x + (rand() - 0.5) * 0.34,
            p.y + (rand() - 0.5) * 0.14,
            p.z + (rand() - 0.5) * 0.34
          )
        );
      }

      // Secondary arching twig off the mid-bough for fullness
      const subAngle = spec.angle + (rand() > 0.5 ? 0.42 : -0.42);
      const sdx = Math.cos(subAngle);
      const sdz = Math.sin(subAngle);
      const subMid = new THREE.Vector3(
        mid1.x + sdx * 0.75,
        mid1.y + 0.32,
        mid1.z + sdz * 0.75
      );
      const subTip = new THREE.Vector3(
        mid1.x + sdx * 1.25,
        mid1.y - 0.12,
        mid1.z + sdz * 1.25
      );
      branchGeos.push(
        createTaperedBranchGeometry([mid1, subMid, subTip], 0.048, 0.014, 10, 5)
      );

      const subCurve = new THREE.CatmullRomCurve3([mid1, subMid, subTip]);
      const subSamples = lowPower ? 3 : 5;
      for (let s = 0; s < subSamples; s++) {
        const t = 0.3 + (s / (subSamples - 1)) * 0.7;
        anchorPoints.push(subCurve.getPointAt(t));
      }
    }

    // Add crown-top foliage clusters so the silhouette is lush and cohesive
    const crownCount = lowPower ? 10 : 18;
    for (let c = 0; c < crownCount; c++) {
      const a = rand() * Math.PI * 2;
      const r = 0.25 + rand() * 1.15;
      anchorPoints.push(
        new THREE.Vector3(
          0.28 + Math.cos(a) * r,
          3.55 + rand() * 0.65,
          -0.12 + Math.sin(a) * r
        )
      );
    }

    const mergedWood = mergeSimpleGeometries(branchGeos);

    // Build all hanging weeping foliage curtains in ONE merged BufferGeometry
    const fPositions: number[] = [];
    const fNormals: number[] = [];
    const fUvs: number[] = [];
    const fPhases: number[] = [];
    const fSways: number[] = [];
    const fIndices: number[] = [];
    let fVertexOffset = 0;

    const segY = 7;

    for (const anchor of anchorPoints) {
      // Crossed double-ribbon per anchor so strands have rich volume from every camera angle
      const ribbonCount = 2;
      const length = 1.15 + rand() * 1.45;
      const width = 0.26 + rand() * 0.22;
      const phase = rand() * Math.PI * 2;
      const swayAmp = 0.18 + rand() * 0.22;
      const baseAngle = rand() * Math.PI;

      for (let r = 0; r < ribbonCount; r++) {
        const yaw = baseAngle + r * (Math.PI * 0.52);
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);

        for (let iy = 0; iy <= segY; iy++) {
          const v = 1 - iy / segY; // 1 at top anchor, 0 at hanging tip
          const y = anchor.y - (iy / segY) * length;
          // Gentle outward drape arc
          const outward = Math.sin((iy / segY) * Math.PI * 0.65) * 0.08;

          for (let ix = 0; ix <= 1; ix++) {
            const u = ix;
            const localX = (ix - 0.5) * width;
            const wx = anchor.x + localX * cosY + outward * sinY;
            const wz = anchor.z + localX * sinY + outward * cosY;

            fPositions.push(wx, y, wz);
            fNormals.push(sinY, 0.25, cosY);
            fUvs.push(u, v);
            fPhases.push(phase + r * 0.35);
            fSways.push(swayAmp);
          }
        }

        for (let iy = 0; iy < segY; iy++) {
          const rowA = fVertexOffset + iy * 2;
          const rowB = rowA + 2;
          fIndices.push(rowA, rowB, rowA + 1);
          fIndices.push(rowA + 1, rowB, rowB + 1);
        }
        fVertexOffset += (segY + 1) * 2;
      }
    }

    const mergedFoliage = new THREE.BufferGeometry();
    mergedFoliage.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(fPositions, 3)
    );
    mergedFoliage.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(fNormals, 3)
    );
    mergedFoliage.setAttribute("uv", new THREE.Float32BufferAttribute(fUvs, 2));
    mergedFoliage.setAttribute(
      "aPhase",
      new THREE.Float32BufferAttribute(fPhases, 1)
    );
    mergedFoliage.setAttribute(
      "aSwayAmp",
      new THREE.Float32BufferAttribute(fSways, 1)
    );
    mergedFoliage.setIndex(fIndices);

    return { woodGeometry: mergedWood, foliageGeometry: mergedFoliage };
  }, [lowPower]);

  const foliageUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uWindStrength: { value: 1.0 },
      uFoliageDark: { value: new THREE.Color("#1a2621") },
      uFoliageLight: { value: new THREE.Color("#4f664b") },
      uSunGlowColor: { value: new THREE.Color("#e8a35a") },
    }),
    []
  );

  useFrame((_, delta) => {
    const scroll = scrollProgressRef.current ?? 0;
    const dt = Math.min(delta, 0.05);

    if (foliageMatRef.current) {
      foliageMatRef.current.uniforms.uTime.value += dt;
      foliageMatRef.current.uniforms.uScroll.value = scroll;
      foliageMatRef.current.uniforms.uWindStrength.value =
        0.95 + Math.sin(scroll * Math.PI) * 0.35;
    }

    // Subtle organic breathing lean of the entire tree crown
    if (groupRef.current) {
      const t = foliageMatRef.current?.uniforms.uTime.value ?? 0;
      groupRef.current.rotation.z =
        -0.03 + Math.sin(t * 0.65) * 0.012 + scroll * 0.018;
    }
  });

  return (
    <group ref={groupRef} position={[0.45, -0.25, -1.6]}>
      {/* Gnarled Timberline Bark Trunk & Boughs */}
      <mesh geometry={woodGeometry}>
        <meshStandardMaterial
          color="#2c2420"
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>

      {/* Swaying Weeping Foliage Curtains */}
      <mesh geometry={foliageGeometry}>
        <shaderMaterial
          ref={foliageMatRef}
          vertexShader={WEEPING_FOLIAGE_VERTEX_SHADER}
          fragmentShader={WEEPING_FOLIAGE_FRAGMENT_SHADER}
          uniforms={foliageUniforms}
          side={THREE.DoubleSide}
          transparent
          depthWrite={true}
        />
      </mesh>
    </group>
  );
}
