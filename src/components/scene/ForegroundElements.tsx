"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "./utils";

interface ForegroundElementsProps {
  scrollProgressRef: React.RefObject<number>;
  lowPower?: boolean;
}

interface FlowerData {
  x: number;
  y: number;
  z: number;
  scale: number;
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

export function ForegroundElements({
  scrollProgressRef,
  lowPower = false,
}: ForegroundElementsProps) {
  const flowerMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const rockGeos = useMemo(
    () => ({
      largeLeft: createAlpineRockGeometry(101, 1.05),
      medLeft: createAlpineRockGeometry(202, 0.62),
      largeRight: createAlpineRockGeometry(303, 0.95),
      smallScree: createAlpineRockGeometry(404, 0.36),
    }),
    []
  );

  const flowerData = useMemo(() => {
    const rand = createSeededRandom(8842);
    const flowerCount = lowPower ? 18 : 34;

    const flowers: FlowerData[] = [];
    for (let i = 0; i < flowerCount; i++) {
      const side = rand() > 0.45 ? -1 : 1;
      const x = side < 0 ? -3.1 + rand() * 2.5 : 0.9 + rand() * 2.6;
      const z = 1.0 + rand() * 2.8;
      const y = -0.68 - (z - 1.2) * 0.08 + rand() * 0.12;
      flowers.push({
        x,
        y,
        z,
        scale: 0.7 + rand() * 0.5,
        rotY: rand() * Math.PI * 2,
        phase: rand() * Math.PI * 2,
      });
    }

    return flowers;
  }, [lowPower]);

  useFrame((_, delta) => {
    timeRef.current += Math.min(delta, 0.05);
    const t = timeRef.current;
    const scroll = scrollProgressRef.current ?? 0;

    if (flowerMeshRef.current) {
      for (let i = 0; i < flowerData.length; i++) {
        const f = flowerData[i];
        const sway = Math.sin(t * 2.1 + f.phase + scroll * 3.5) * 0.14;
        dummy.position.set(f.x + sway * 0.18, f.y, f.z);
        dummy.rotation.set(sway * 0.5, f.rotY, sway);
        dummy.scale.setScalar(f.scale);
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
