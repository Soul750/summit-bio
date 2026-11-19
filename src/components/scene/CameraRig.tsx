"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraRigProps {
  scrollProgressRef: React.RefObject<number>;
}

const POS_HERO = new THREE.Vector3(-0.35, 1.38, 6.45);
const POS_BIO = new THREE.Vector3(1.55, 2.05, 4.75);
const POS_TWILIGHT = new THREE.Vector3(-0.85, 2.55, 7.15);

const LOOK_HERO = new THREE.Vector3(0.35, 1.72, -1.9);
const LOOK_BIO = new THREE.Vector3(-0.35, 2.08, -2.6);
const LOOK_TWILIGHT = new THREE.Vector3(0.25, 1.65, -4.5);

export function CameraRig({ scrollProgressRef }: CameraRigProps) {
  const { camera } = useThree();
  const pointerRef = useRef({ x: 0, y: 0 });
  const targetPos = useRef(POS_HERO.clone());
  const targetLook = useRef(LOOK_HERO.clone());
  const currentLook = useRef(LOOK_HERO.clone());

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
      pointerRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame((_, delta) => {
    const scroll = THREE.MathUtils.clamp(scrollProgressRef.current ?? 0, 0, 1);
    const dt = Math.min(delta, 0.05);
    const damp = 1 - Math.exp(-3.4 * dt);

    // Two-stage narrative choreography across Hero -> Life & Work -> Twilight Horizon
    if (scroll <= 0.55) {
      const t = THREE.MathUtils.smoothstep(scroll, 0, 0.55);
      targetPos.current.lerpVectors(POS_HERO, POS_BIO, t);
      targetLook.current.lerpVectors(LOOK_HERO, LOOK_BIO, t);
    } else {
      const t = THREE.MathUtils.smoothstep(scroll, 0.55, 1.0);
      targetPos.current.lerpVectors(POS_BIO, POS_TWILIGHT, t);
      targetLook.current.lerpVectors(LOOK_BIO, LOOK_TWILIGHT, t);
    }

    // Subtle pointer parallax so foreground boulders & weeping canopy shift gently
    targetPos.current.x += pointerRef.current.x * 0.28;
    targetPos.current.y -= pointerRef.current.y * 0.14;

    camera.position.lerp(targetPos.current, damp);
    currentLook.current.lerp(targetLook.current, damp);
    camera.lookAt(currentLook.current);
  });

  return null;
}
