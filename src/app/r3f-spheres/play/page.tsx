"use client";

import { useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { map } from "@/lib/creative/math";
import { usePlaying } from "@/lib/creative/motion";
import { PlayShell } from "@/components/play-shell";
import {
  spherePositions,
  bob,
  GRID_COLS,
  GRID_ROWS,
  SPHERE_SPACING,
  HUE_RANGE,
  WAVE_AMPLITUDE,
} from "../field";

const MAX_SPHERE_COUNT = GRID_COLS * GRID_ROWS;
const ALL_POSITIONS = spherePositions(GRID_COLS, GRID_ROWS, SPHERE_SPACING);
const SPHERE_RADIUS = 0.42;

const DEFAULT_SPHERE_COUNT = MAX_SPHERE_COUNT;
const DEFAULT_ROTATION_SPEED = 6; // maps to 0.06 GROUP_SPIN_SPEED
const DEFAULT_METALNESS = 15; // maps to 0.15
const DEFAULT_ROUGHNESS = 35; // maps to 0.35

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

interface SphereFieldProps {
  isLight: boolean;
  playing: boolean;
  sphereCount: number;
  rotationSpeed: number;
  metalness: number;
  roughness: number;
}

function SphereField({
  isLight,
  playing,
  sphereCount,
  rotationSpeed,
  metalness,
  roughness,
}: SphereFieldProps): React.ReactElement {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  // Accumulated play-time in seconds. We advance it only when playing is true
  // so pausing holds the scene at its exact current position.
  const playTimeRef = useRef<number>(0);
  const lastClockRef = useRef<number | null>(null);

  // Individual sphere spin speed tracks group spin at a fixed ratio.
  const spinRatio = 0.08 / 0.06;

  useFrame((state) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!mesh || !group) return;

    const clockNow = state.clock.getElapsedTime();

    if (playing) {
      if (lastClockRef.current !== null) {
        playTimeRef.current += clockNow - lastClockRef.current;
      }
      lastClockRef.current = clockNow;
    } else {
      // When paused, keep lastClockRef current so we don't skip time on resume.
      lastClockRef.current = clockNow;
    }

    const t = playTimeRef.current;
    group.rotation.y = t * rotationSpeed;

    const active = Math.min(sphereCount, ALL_POSITIONS.length);

    for (let i = 0; i < MAX_SPHERE_COUNT; i++) {
      if (i >= active) {
        // Hide inactive instances by zeroing their scale.
        tempObject.position.set(0, -9999, 0);
        tempObject.scale.setScalar(0);
        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
        continue;
      }

      const pos = ALL_POSITIONS[i];
      if (!pos) continue;

      const y = bob(pos.col, pos.row, t);

      tempObject.position.set(pos.x, y, pos.z);
      const scale = map(y, -WAVE_AMPLITUDE, WAVE_AMPLITUDE, 0.82, 1.15);
      tempObject.scale.setScalar(scale);
      tempObject.rotation.y = t * rotationSpeed * spinRatio + pos.col * 0.3;
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const hue = map(y, -WAVE_AMPLITUDE, WAVE_AMPLITUDE, HUE_RANGE[0], HUE_RANGE[1]);
      const lightness = isLight ? 0.38 : 0.58;
      tempColor.setHSL(hue / 360, 0.85, lightness);
      mesh.setColorAt(i, tempColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_SPHERE_COUNT]} castShadow>
        <sphereGeometry args={[SPHERE_RADIUS, 24, 24]} />
        <meshStandardMaterial roughness={roughness} metalness={metalness} />
      </instancedMesh>
    </group>
  );
}

// XZ half-extent of the grid plus sphere radius and wave amplitude.
// halfW = halfD = ((GRID_COLS - 1) * SPHERE_SPACING) / 2 = 7.7
// Diagonal bounding radius in XZ = halfW * sqrt(2) ≈ 10.89; add sphere radius + wave amplitude.
const FIELD_BOUNDING_RADIUS =
  (((GRID_COLS - 1) * SPHERE_SPACING) / 2) * Math.SQRT2 + SPHERE_RADIUS + WAVE_AMPLITUDE;

const FOV_RAD = (45 * Math.PI) / 180;

/**
 * Sits inside the Canvas and repositions the PerspectiveCamera so the field
 * fills the viewport at any size. The camera direction (angled view) is kept
 * by normalizing the current position vector and scaling it to the new distance.
 */
function CameraFit(): null {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const { width, height } = size;
    const aspect = width / height;
    // Use the shorter axis to drive the distance so the field fills even on
    // tall narrow (portrait) viewports.
    const fovHalfTan = Math.tan(FOV_RAD / 2);
    const distance = (FIELD_BOUNDING_RADIUS * 1.1) / (fovHalfTan * Math.min(1, aspect));

    // Preserve the normalized direction of the existing camera position.
    const dir = camera.position.clone().normalize();
    camera.position.copy(dir.multiplyScalar(distance));
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

export default function R3FSpheresPage(): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isLight = (resolvedTheme ?? "dark") === "light";
  const playing = usePlaying();

  const [sphereCount, setSphereCount] = useState<number>(DEFAULT_SPHERE_COUNT);
  const [rotationSpeedPct, setRotationSpeedPct] = useState<number>(DEFAULT_ROTATION_SPEED);
  const [metalnessPct, setMetalnessPct] = useState<number>(DEFAULT_METALNESS);
  const [roughnessPct, setRoughnessPct] = useState<number>(DEFAULT_ROUGHNESS);

  const bgColor = isLight ? "#eef0f4" : "#07080d";

  // Convert integer slider values to float material/speed values.
  const rotationSpeed = rotationSpeedPct / 100;
  const metalness = metalnessPct / 100;
  const roughness = roughnessPct / 100;

  const sphereCountLabelId = "sphere-count-label";
  const rotationSpeedLabelId = "rotation-speed-label";
  const metalnessLabelId = "metalness-label";
  const roughnessLabelId = "roughness-label";

  return (
    <PlayShell
      slug="r3f-spheres"
      title="Sphere Field"
      visualLabel="Interactive 3D animation: a grid of spheres rippling in a travelling sine wave, lit with warm and cool directional lights"
      controls={
        <>
          <div className="flex items-center gap-2">
            <span id={sphereCountLabelId} className="text-xs text-foreground/70">
              spheres
            </span>
            <input
              type="range"
              min={1}
              max={MAX_SPHERE_COUNT}
              value={sphereCount}
              onChange={(e) => setSphereCount(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={sphereCountLabelId}
              aria-valuemin={1}
              aria-valuemax={MAX_SPHERE_COUNT}
              aria-valuenow={sphereCount}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {sphereCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span id={rotationSpeedLabelId} className="text-xs text-foreground/70">
              speed
            </span>
            <input
              type="range"
              min={0}
              max={20}
              value={rotationSpeedPct}
              onChange={(e) => setRotationSpeedPct(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={rotationSpeedLabelId}
              aria-valuemin={0}
              aria-valuemax={20}
              aria-valuenow={rotationSpeedPct}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {rotationSpeed.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span id={metalnessLabelId} className="text-xs text-foreground/70">
              metal
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={metalnessPct}
              onChange={(e) => setMetalnessPct(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={metalnessLabelId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={metalnessPct}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {metalness.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span id={roughnessLabelId} className="text-xs text-foreground/70">
              rough
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={roughnessPct}
              onChange={(e) => setRoughnessPct(Number(e.target.value))}
              className="w-24 accent-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-labelledby={roughnessLabelId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={roughnessPct}
            />
            <span className="w-8 text-right text-xs text-foreground/70 tabular-nums">
              {roughness.toFixed(2)}
            </span>
          </div>
        </>
      }
      attribution={
        <>
          Built with{" "}
          <a
            href="https://threejs.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            three.js
          </a>{" "}
          and{" "}
          <a
            href="https://r3f.docs.pmnd.rs/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            React Three Fiber
          </a>{" "}
          by Poimandres.
        </>
      }
    >
      <Canvas
        camera={{ position: [14, 10, 18], fov: 45 }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* Set the clear color in-scene (client only) so the Canvas DOM style
            carries no theme-dependent attribute that would mismatch on SSR. */}
        <color attach="background" args={[bgColor]} />
        <CameraFit />
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
        <SphereField
          isLight={isLight}
          playing={playing}
          sphereCount={sphereCount}
          rotationSpeed={rotationSpeed}
          metalness={metalness}
          roughness={roughness}
        />
      </Canvas>
    </PlayShell>
  );
}
