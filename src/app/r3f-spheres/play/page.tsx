"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
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

interface SphereFieldProps {
  isLight: boolean;
}

function SphereField({ isLight }: SphereFieldProps): React.ReactElement {
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
      // Dark theme: lightness 0.58 (bright/glowing); light theme: lightness 0.38 (deeper, readable against pale bg)
      const lightness = isLight ? 0.38 : 0.58;
      tempColor.setHSL(hue / 360, 0.85, lightness);
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
  const { resolvedTheme } = useTheme();
  const isLight = (resolvedTheme ?? "dark") === "light";

  const bgColor = isLight ? "#eef0f4" : "#07080d";
  const borderColor = isLight ? "border-black/10" : "border-white/10";
  const textMuted = isLight ? "text-black/60" : "text-white/70";
  const textHeading = isLight ? "text-black/80" : "text-white/80";
  const linkHover = isLight
    ? "hover:text-black focus-visible:ring-black/50"
    : "hover:text-white focus-visible:ring-white/70";

  return (
    <main className="min-h-screen text-foreground flex flex-col" style={{ background: bgColor }}>
      <header
        className={`px-4 py-3 flex flex-wrap items-center gap-3 border-b ${borderColor} sm:px-6`}
      >
        <nav aria-label="Back to detail page">
          <Link
            href="/r3f-spheres"
            className={`inline-flex items-center gap-1 text-sm ${textMuted} ${linkHover} underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 rounded`}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </Link>
        </nav>
        <h1 className={`text-sm font-medium tracking-wide ${textHeading}`}>Sphere Field</h1>
      </header>

      <section
        className="flex-1 relative"
        aria-label="Interactive 3D animation: a grid of spheres rippling in a travelling sine wave, lit with warm and cool directional lights"
      >
        <Canvas
          camera={{ position: [14, 10, 18], fov: 45 }}
          style={{ position: "absolute", inset: 0, background: bgColor }}
        >
          <ambientLight intensity={isLight ? 1.2 : 0.7} />
          <directionalLight position={[6, 12, 8]} intensity={isLight ? 3.0 : 2.4} color="#ffffff" />
          <directionalLight
            position={[-8, 4, -6]}
            intensity={isLight ? 1.2 : 0.9}
            color={isLight ? "#7a8aff" : "#9aa6ff"}
          />
          <pointLight
            position={[0, 8, 10]}
            intensity={isLight ? 80 : 60}
            color={isLight ? "#ff7a50" : "#ff9f7a"}
            decay={2}
          />
          <SphereField isLight={isLight} />
        </Canvas>
      </section>

      <footer className={`px-4 py-4 text-xs ${textMuted} border-t ${borderColor} sm:px-6`}>
        Built with{" "}
        <a
          href="https://threejs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 ${linkHover} focus-visible:outline-none focus-visible:ring-2 rounded`}
        >
          three.js
        </a>{" "}
        and{" "}
        <a
          href="https://r3f.docs.pmnd.rs/"
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 ${linkHover} focus-visible:outline-none focus-visible:ring-2 rounded`}
        >
          React Three Fiber
        </a>{" "}
        by Poimandres.
      </footer>
    </main>
  );
}
