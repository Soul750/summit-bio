"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "./utils";

interface DriftingParticlesProps {
  scrollProgressRef: React.RefObject<number>;
  lowPower?: boolean;
}

interface LeafParticle {
  x: number;
  y: number;
  z: number;
  speedX: number;
  speedY: number;
  driftPhase: number;
  spinSpeed: number;
  scale: number;
}

export function DriftingParticles({
  scrollProgressRef,
  lowPower = false,
}: DriftingParticlesProps) {
  const motesRef = useRef<THREE.Points>(null);
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const moteCount = lowPower ? 85 : 170;
  const leafCount = lowPower ? 36 : 78;

  const { moteGeometry, moteSeeds, leafData } = useMemo(() => {
    const rand = createSeededRandom(31415);

    const positions = new Float32Array(moteCount * 3);
    const seeds = new Float32Array(moteCount * 3);

    for (let i = 0; i < moteCount; i++) {
      const x = (rand() - 0.5) * 14;
      const y = -0.5 + rand() * 6.5;
      const z = -6.5 + rand() * 11.5;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      seeds[i * 3] = rand() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.25 + rand() * 0.55;
      seeds[i * 3 + 2] = 0.4 + rand() * 0.8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const leaves: LeafParticle[] = [];
    for (let i = 0; i < leafCount; i++) {
      leaves.push({
        x: -2.5 + rand() * 8.5,
        y: 0.4 + rand() * 4.5,
        z: -4.2 + rand() * 6.8,
        speedX: 0.26 + rand() * 0.34,
        speedY: -0.08 - rand() * 0.12,
        driftPhase: rand() * Math.PI * 2,
        spinSpeed: 0.9 + rand() * 1.6,
        scale: 0.7 + rand() * 0.65,
      });
    }

    return { moteGeometry: geo, moteSeeds: seeds, leafData: leaves };
  }, [moteCount, leafCount]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    timeRef.current += dt;
    const t = timeRef.current;
    const scroll = scrollProgressRef.current ?? 0;

    // Drift golden light motes / pollen gently across the ridge
    if (motesRef.current) {
      const posAttr = motesRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      for (let i = 0; i < moteCount; i++) {
        const phase = moteSeeds[i * 3];
        const speed = moteSeeds[i * 3 + 1];
        let x = posAttr.getX(i) + (0.14 + scroll * 0.08) * speed * dt;
        let y =
          posAttr.getY(i) + Math.sin(t * 0.7 + phase) * 0.09 * dt;
        const z = posAttr.getZ(i) + Math.cos(t * 0.5 + phase) * 0.04 * dt;

        if (x > 7.5) x = -7.5;
        if (y > 6.4) y = -0.4;
        if (y < -0.6) y = 5.8;

        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

      const mat = motesRef.current.material as THREE.PointsMaterial;
      mat.opacity = THREE.MathUtils.lerp(0.62, 0.35, scroll);
    }

    // Windblown weeping leaves tumbling gently from the canopy (pure time-based wrap)
    if (leavesRef.current) {
      const spanX = 8.4;
      const spanY = 5.4;
      for (let i = 0; i < leafData.length; i++) {
        const l = leafData[i];
        const rawX = l.x + t * l.speedX * (1 + scroll * 0.35);
        const wrappedX = ((((rawX + 2.2) % spanX) + spanX) % spanX) - 2.2;
        const rawY = l.y + t * l.speedY;
        const wrappedY =
          ((((rawY + 1.1) % spanY) + spanY) % spanY) -
          1.1 +
          Math.sin(t * 1.4 + l.driftPhase) * 0.14;

        dummy.position.set(
          wrappedX,
          wrappedY,
          l.z + Math.sin(t * 0.9 + l.driftPhase) * 0.25
        );
        dummy.rotation.set(
          t * l.spinSpeed * 0.6 + l.driftPhase,
          t * l.spinSpeed + l.driftPhase,
          Math.sin(t * 1.8 + l.driftPhase) * 0.8
        );
        dummy.scale.set(0.065 * l.scale, 0.022 * l.scale, 0.015 * l.scale);
        dummy.updateMatrix();
        leavesRef.current.setMatrixAt(i, dummy.matrix);
      }
      leavesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Atmospheric Golden-Hour Light Motes & Pollen */}
      <points ref={motesRef} geometry={moteGeometry}>
        <pointsMaterial
          color="#f7cfa0"
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Windblown Weeping Willow Leaves */}
      <instancedMesh ref={leavesRef} args={[undefined, undefined, leafCount]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#7d8f66"
          emissive="#c98442"
          emissiveIntensity={0.22}
          roughness={0.75}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  );
}
