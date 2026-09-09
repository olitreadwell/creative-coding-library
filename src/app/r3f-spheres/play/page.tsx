"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { map } from "@/lib/creative/math";
import { usePlaying } from "@/lib/creative/motion";
import { PlayShell } from "@/components/play-shell";
import { bob, WAVE_AMPLITUDE, HUE_RANGE } from "../field";

// A big grid centered under the camera so it extends in every direction and
// fades into fog at the horizon: it reads as an endless ocean of spheres seen
// from above at a shallow downward angle.
const COLS = 56;
const ROWS = 56;
const SPACING = 1.4;
const COUNT = COLS * ROWS;
const SPHERE_RADIUS = 0.42;
const HALF_W = ((COLS - 1) * SPACING) / 2;
const HALF_D = ((ROWS - 1) * SPACING) / 2;

type GridCell = { x: number; z: number; col: number; row: number };

const CELLS: GridCell[] = (() => {
  const cells: GridCell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ x: col * SPACING - HALF_W, z: row * SPACING - HALF_D, col, row });
    }
  }
  return cells;
})();

const DEFAULT_SPEED = 100; // %, maps to 1.0x wave speed
const DEFAULT_AMPLITUDE = 100; // %, maps to 1.0x wave height
const DEFAULT_METALNESS = 25;
const DEFAULT_ROUGHNESS = 35;

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

interface SphereFieldProps {
  isLight: boolean;
  playing: boolean;
  speed: number;
  amplitude: number;
  metalness: number;
  roughness: number;
}

function SphereField({
  isLight,
  playing,
  speed,
  amplitude,
  metalness,
  roughness,
}: SphereFieldProps): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const playTimeRef = useRef<number>(0);
  const lastClockRef = useRef<number | null>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const clockNow = state.clock.getElapsedTime();
    if (playing && lastClockRef.current !== null) {
      playTimeRef.current += (clockNow - lastClockRef.current) * speed;
    }
    lastClockRef.current = clockNow;

    const t = playTimeRef.current;
    const range = Math.max(0.0001, WAVE_AMPLITUDE * amplitude);

    for (let i = 0; i < COUNT; i++) {
      const cell = CELLS[i];
      if (!cell) continue;
      const y = bob(cell.col, cell.row, t) * amplitude;

      tempObject.position.set(cell.x, y, cell.z);
      tempObject.scale.setScalar(map(y, -range, range, 0.82, 1.15));
      tempObject.rotation.y = t * 0.15 + cell.col * 0.3;
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const hue = map(y, -range, range, HUE_RANGE[0], HUE_RANGE[1]);
      tempColor.setHSL(hue / 360, 0.85, isLight ? 0.4 : 0.58);
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
      <meshStandardMaterial roughness={roughness} metalness={metalness} />
    </instancedMesh>
  );
}

// Elevated camera looking down at roughly 38 degrees, like standing over an
// ocean that runs to the horizon in every direction. Kept responsive so the
// field still fills the frame on tall/narrow viewports.
function CameraRig(): null {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    const pull = aspect < 1 ? 1 + (1 - aspect) * 0.8 : 1;
    // Height/forward chosen so the view tilts ~38 degrees below horizontal.
    camera.position.set(0, 17 * pull, 21 * pull);
    camera.lookAt(0, 0, -10);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function R3FSpheresPage(): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isLight = (resolvedTheme ?? "dark") === "light";
  const playing = usePlaying();

  const [speedPct, setSpeedPct] = useState<number>(DEFAULT_SPEED);
  const [amplitudePct, setAmplitudePct] = useState<number>(DEFAULT_AMPLITUDE);
  const [metalnessPct, setMetalnessPct] = useState<number>(DEFAULT_METALNESS);
  const [roughnessPct, setRoughnessPct] = useState<number>(DEFAULT_ROUGHNESS);

  const bgColor = isLight ? "#eef0f4" : "#07080d";
  const speed = speedPct / 100;
  const amplitude = amplitudePct / 100;
  const metalness = metalnessPct / 100;
  const roughness = roughnessPct / 100;

  const fogArgs = useMemo<[string, number, number]>(() => [bgColor, 18, 66], [bgColor]);

  const sliders: Array<{
    id: string;
    label: string;
    value: number;
    set: (n: number) => void;
    min: number;
    max: number;
    fmt: (n: number) => string;
  }> = [
    {
      id: "speed",
      label: "speed",
      value: speedPct,
      set: setSpeedPct,
      min: 0,
      max: 250,
      fmt: () => speed.toFixed(2),
    },
    {
      id: "amp",
      label: "amplitude",
      value: amplitudePct,
      set: setAmplitudePct,
      min: 0,
      max: 300,
      fmt: () => amplitude.toFixed(2),
    },
    {
      id: "metal",
      label: "metal",
      value: metalnessPct,
      set: setMetalnessPct,
      min: 0,
      max: 100,
      fmt: () => metalness.toFixed(2),
    },
    {
      id: "rough",
      label: "rough",
      value: roughnessPct,
      set: setRoughnessPct,
      min: 0,
      max: 100,
      fmt: () => roughness.toFixed(2),
    },
  ];

  return (
    <PlayShell
      slug="r3f-spheres"
      title="Sphere Field"
      visualLabel="An endless field of spheres rippling in a travelling wave and receding into the distance."
      controls={
        <>
          {sliders.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <span id={`sf-${s.id}`} className="text-xs text-foreground/70">
                {s.label}
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                className="w-20 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-labelledby={`sf-${s.id}`}
                aria-valuemin={s.min}
                aria-valuemax={s.max}
                aria-valuenow={s.value}
              />
              <span className="w-9 text-right text-xs text-foreground/70 tabular-nums">
                {s.fmt(s.value)}
              </span>
            </div>
          ))}
        </>
      }
      attribution={
        <>
          Built with{" "}
          <a
            href="https://r3f.docs.pmnd.rs/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            React Three Fiber
          </a>{" "}
          + three.js. Instanced spheres with fog for an endless horizon.
        </>
      }
    >
      <Canvas
        camera={{ position: [0, 17, 21], fov: 55 }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={fogArgs} />
        <CameraRig />
        <ambientLight intensity={isLight ? 1.1 : 0.6} />
        <directionalLight position={[6, 12, 4]} intensity={isLight ? 2.8 : 2.2} color="#ffffff" />
        <directionalLight
          position={[-8, 5, 2]}
          intensity={isLight ? 1.1 : 0.9}
          color={isLight ? "#7a8aff" : "#9aa6ff"}
        />
        <pointLight
          position={[0, 5, 7]}
          intensity={isLight ? 70 : 55}
          color={isLight ? "#ff7a50" : "#ff9f7a"}
          decay={2}
        />
        <SphereField
          isLight={isLight}
          playing={playing}
          speed={speed}
          amplitude={amplitude}
          metalness={metalness}
          roughness={roughness}
        />
      </Canvas>
    </PlayShell>
  );
}
