import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "hand-pinch",
  title: "Hand Pinch",
  description:
    "Pinch your fingers in front of the camera to grab a blob. No mouse needed. Hand tracking only.",
  library: "MediaPipe + Canvas 2D",
  concepts: ["hand-tracking", "webcam", "interaction"],
  level: 3,
  technique: "MediaPipe hand landmarks + pinch detection on Canvas 2D",
  source: {
    author: "Google MediaPipe",
    title: "Hand Landmarker (Tasks Vision)",
    url: "https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker",
    license: "Apache-2.0",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T17:22:59+12:00",
  prereqs: ["webcam-mosaic", "squish"],
  understandWhen:
    "You can describe how a pinch is detected from two landmark points and predict what fails when the hand is partly off screen.",
  predictPrompt:
    "If your thumb and index finger cross but do not touch, does the blob respond? Why or why not?",
  recallChecks: [
    {
      q: "Which two landmark points determine whether a pinch is detected?",
      a: "Thumb tip (point 4) and index fingertip (point 8). The pinch fires when the distance between them falls below a threshold.",
    },
    {
      q: "What is linear interpolation (lerp) doing in this sketch?",
      a: "Each frame, the blob moves a fraction of the remaining distance toward the pinch point, producing smooth following instead of an instant jump.",
    },
    {
      q: "Why does the sketch require a button press before the camera starts?",
      a: "Privacy by default: the camera and tracking model only initialize after the user explicitly consents.",
    },
  ],
});
