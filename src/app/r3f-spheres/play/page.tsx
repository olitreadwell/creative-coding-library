"use client";

import { useRef } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { map } from "@/lib/creative/math";
import {
  spherePositions,
  bob,
  GRID_COLS,
  GRID_ROWS,
  SPHERE_SPACING,
  HUE_RANGE,
  WAVE_AMPLITUDE,
} from "../field";

const POSITIONS = spherePositions(GRID_COLS, GRID_ROWS, SPHERE_SPACING);
const SPHERE_COUNT = POSITIONS.length;
const SPHERE_RADIUS = 0.42;

const ROTATION_SPEED = 0.08;
const GROUP_SPIN_SPEED = 0.06;

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

function SphereField(): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const t = state.clock.getElapsedTime();
    group.rotation.y = t * GROUP_SPIN_SPEED;

    for (let i = 0; i < SPHERE_COUNT; i++) {
      const pos = POSITIONS[i];
      if (!pos) continue;

      const y = bob(pos.col, pos.row, t);

      tempObject.position.set(pos.x, y, pos.z);
      const scale = map(y, -WAVE_AMPLITUDE, WAVE_AMPLITUDE, 0.82, 1.15);
      tempObject.scale.setScalar(scale);
      tempObject.rotation.y = t * ROTATION_SPEED + pos.col * 0.3;
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const hue = map(y, -WAVE_AMPLITUDE, WAVE_AMPLITUDE, HUE_RANGE[0], HUE_RANGE[1]);
      tempColor.setHSL(hue / 360, 0.85, 0.58);
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SPHERE_COUNT]} castShadow>
        <sphereGeometry args={[SPHERE_RADIUS, 24, 24]} />
        <meshStandardMaterial roughness={0.35} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}

export default function R3FSpheresPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-[#07080d] text-foreground flex flex-col">
      <header className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-white/10 sm:px-6">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
          >
            &larr; home
          </Link>
        </nav>
        <h1 className="text-sm font-medium tracking-wide text-white/80">Sphere Field</h1>
      </header>

      <section
        className="flex-1 relative"
        aria-label="Interactive 3D animation: a grid of spheres rippling in a travelling sine wave, lit with warm and cool directional lights"
      >
        <Canvas
          camera={{ position: [14, 10, 18], fov: 45 }}
          style={{ position: "absolute", inset: 0, background: "#07080d" }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[6, 12, 8]} intensity={2.4} color="#ffffff" />
          <directionalLight position={[-8, 4, -6]} intensity={0.9} color="#9aa6ff" />
          <pointLight position={[0, 8, 10]} intensity={60} color="#ff9f7a" decay={2} />
          <SphereField />
        </Canvas>
      </section>

      <footer className="px-4 py-4 text-xs text-white/70 border-t border-white/10 sm:px-6">
        Built with{" "}
        <a
          href="https://threejs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
        >
          three.js
        </a>{" "}
        and{" "}
        <a
          href="https://r3f.docs.pmnd.rs/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded"
        >
          React Three Fiber
        </a>{" "}
        by Poimandres.
      </footer>
    </main>
  );
}
