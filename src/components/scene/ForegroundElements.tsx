"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "./utils";

interface ForegroundElementsProps {
  scrollProgressRef: React.RefObject<number>;
  lowPower?: boolean;
}

interface GrassBladeData {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  rotY: number;
  phase: number;
}

/**
 * Generates a faceted, weathered granite boulder geometry.
 */
function createAlpineRockGeometry(seed: number, radius = 1): THREE.BufferGeometry {
  const rand = createSeededRandom(seed);
  const geo = new THREE.DodecahedronGeometry(radius, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const jitter = 0.78 + rand() * 0.42;
    // Slightly flatten bottom & compress vertically for natural alpine scree look
    pos.setXYZ(i, x * jitter, y * jitter * 0.68, z * jitter);
  }
  geo.computeVertexNormals();
  return geo;
}

function createForegroundGrassClump(): THREE.BufferGeometry {
  const blades = [
    { ox: 0, oz: 0, ry: 0.2, tilt: 0.14, h: 0.56, w: 0.056 },
    { ox: -0.04, oz: 0.02, ry: 1.4, tilt: 0.26, h: 0.46, w: 0.048 },
    { ox: 0.04, oz: -0.02, ry: 2.7, tilt: 0.24, h: 0.48, w: 0.05 },
    { ox: -0.02, oz: -0.04, ry: 3.9, tilt: 0.28, h: 0.42, w: 0.046 },
    { ox: 0.03, oz: 0.03, ry: 5.1, tilt: 0.22, h: 0.44, w: 0.046 },
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;

  for (const b of blades) {
    const cosY = Math.cos(b.ry);
    const sinY = Math.sin(b.ry);
    const hw = b.w * 0.5;
    const lean = Math.sin(b.tilt) * b.h;
    const pts = [
      [-hw, 0, 0],
      [hw, 0, 0],
      [-hw * 0.45, b.h * 0.52, lean * 0.35],
      [hw * 0.45, b.h * 0.52, lean * 0.35],
      [0, b.h, lean],
    ];
    for (const [lx, ly, lz] of pts) {
      positions.push(b.ox + lx * cosY - lz * sinY, ly, b.oz + lx * sinY + lz * cosY);
      normals.push(sinY * 0.3, 0.9, cosY * 0.3);
    }
    indices.push(offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2, offset + 2, offset + 3, offset + 4);
    offset += 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function ForegroundElements({
  scrollProgressRef,
  lowPower = false,
}: ForegroundElementsProps) {
  const grassMeshRef = useRef<THREE.InstancedMesh>(null);
  const flowerMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);
  const grassClumpGeo = useMemo(() => createForegroundGrassClump(), []);

  const rockGeos = useMemo(
    () => ({
      largeLeft: createAlpineRockGeometry(101, 1.05),
      medLeft: createAlpineRockGeometry(202, 0.62),
      largeRight: createAlpineRockGeometry(303, 0.95),
      smallScree: createAlpineRockGeometry(404, 0.36),
    }),
    []
  );

  const { grassData, flowerData } = useMemo(() => {
    const rand = createSeededRandom(8842);
    const grassCount = lowPower ? 160 : 360;
    const flowerCount = lowPower ? 26 : 52;

    const grass: GrassBladeData[] = [];
    for (let i = 0; i < grassCount; i++) {
      // Cluster along the foreground overlook edge & across the grassy ledge
      const zone = rand();
      const x =
        zone < 0.4
          ? -3.8 + rand() * 3.5
          : zone < 0.8
            ? 0.4 + rand() * 3.6
            : -1.4 + rand() * 2.8;
      const z = 0.4 + rand() * 4.0;
      const y = -0.8 - (z - 1.2) * 0.08 + (rand() - 0.5) * 0.16;
      grass.push({
        x,
        y,
        z,
        scaleX: 0.78 + rand() * 0.75,
        scaleY: 0.7 + rand() * 1.05,
        rotY: rand() * Math.PI * 2,
        phase: rand() * Math.PI * 2,
      });
    }

    const flowers: GrassBladeData[] = [];
    for (let i = 0; i < flowerCount; i++) {
      const side = rand() > 0.45 ? -1 : 1;
      const x = side < 0 ? -3.1 + rand() * 2.7 : 0.7 + rand() * 2.8;
      const z = 0.9 + rand() * 3.1;
      const y = -0.62 - (z - 1.2) * 0.08 + rand() * 0.12;
      flowers.push({
        x,
        y,
        z,
        scaleX: 0.7 + rand() * 0.55,
        scaleY: 0.7 + rand() * 0.55,
        rotY: rand() * Math.PI * 2,
        phase: rand() * Math.PI * 2,
      });
    }

    return { grassData: grass, flowerData: flowers };
  }, [lowPower]);

  useFrame((_, delta) => {
    timeRef.current += Math.min(delta, 0.05);
    const t = timeRef.current;
    const scroll = scrollProgressRef.current ?? 0;

    if (grassMeshRef.current) {
      for (let i = 0; i < grassData.length; i++) {
        const b = grassData[i];
        const sway =
          Math.sin(t * 1.9 + b.phase + scroll * 3.5) * 0.16 +
          Math.cos(t * 0.8 + b.x) * 0.06;
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(sway * 0.4, b.rotY, sway);
        dummy.scale.set(b.scaleX, b.scaleY, b.scaleX);
        dummy.updateMatrix();
        grassMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      grassMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (flowerMeshRef.current) {
      for (let i = 0; i < flowerData.length; i++) {
        const f = flowerData[i];
        const sway = Math.sin(t * 2.1 + f.phase + scroll * 3.5) * 0.14;
        dummy.position.set(f.x + sway * 0.18, f.y, f.z);
        dummy.rotation.set(sway * 0.5, f.rotY, sway);
        dummy.scale.setScalar(f.scaleX);
        dummy.updateMatrix();
        flowerMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      flowerMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Foreground Overlook Boulders creating strong scroll parallax */}
      <mesh
        geometry={rockGeos.largeLeft}
        position={[-2.65, -0.95, 2.35]}
        rotation={[0.1, 0.6, -0.08]}
      >
        <meshStandardMaterial color="#2a2d35" roughness={0.94} metalness={0.04} />
      </mesh>

      <mesh
        geometry={rockGeos.medLeft}
        position={[-1.55, -0.98, 2.9]}
        rotation={[-0.1, 1.2, 0.12]}
      >
        <meshStandardMaterial color="#34363d" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh
        geometry={rockGeos.largeRight}
        position={[2.75, -0.88, 1.95]}
        rotation={[0.05, -0.8, 0.1]}
      >
        <meshStandardMaterial color="#272b34" roughness={0.95} metalness={0.04} />
      </mesh>

      <mesh
        geometry={rockGeos.smallScree}
        position={[1.75, -0.95, 2.7]}
        rotation={[0.2, 0.4, 0.2]}
      >
        <meshStandardMaterial color="#3b3838" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Weathered Alpine Trail Marker Post & Stacked Stone Cairn on Left Overlook */}
      <group position={[-1.92, -0.78, 1.68]} rotation={[0.04, 0.34, -0.06]}>
        {/* Timber Post */}
        <mesh position={[0, 0.58, 0]}>
          <boxGeometry args={[0.11, 1.25, 0.1]} />
          <meshStandardMaterial color="#3f332c" roughness={0.95} />
        </mesh>
        {/* Angled Trail Sign Slat */}
        <mesh position={[0.18, 0.96, 0.02]} rotation={[0, 0, -0.06]}>
          <boxGeometry args={[0.56, 0.14, 0.035]} />
          <meshStandardMaterial color="#4e3f35" roughness={0.92} />
        </mesh>
        {/* Small Stacked Stone Cairn at the base of the marker */}
        <mesh position={[0.26, 0.08, 0.16]} scale={[1.2, 0.52, 1.05]}>
          <dodecahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color="#47464a" roughness={0.94} />
        </mesh>
        <mesh position={[0.25, 0.2, 0.15]} scale={[0.92, 0.46, 0.85]}>
          <dodecahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial color="#555254" roughness={0.92} />
        </mesh>
        <mesh position={[0.26, 0.3, 0.15]} scale={[0.68, 0.42, 0.65]}>
          <dodecahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="#645e5b" roughness={0.9} />
        </mesh>
      </group>

      {/* Swaying Alpine Grasses (Instanced 5-blade clumps) */}
      <instancedMesh
        ref={grassMeshRef}
        args={[grassClumpGeo, undefined, grassData.length]}
      >
        <meshStandardMaterial
          color="#506344"
          emissive="#252f1b"
          emissiveIntensity={0.2}
          roughness={0.85}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Delicate Alpine Wildflower Tips (Instanced) */}
      <instancedMesh
        ref={flowerMeshRef}
        args={[undefined, undefined, flowerData.length]}
      >
        <octahedronGeometry args={[0.038, 0]} />
        <meshStandardMaterial
          color="#e5b87b"
          emissive="#8a5628"
          emissiveIntensity={0.28}
          roughness={0.65}
        />
      </instancedMesh>
    </group>
  );
}
