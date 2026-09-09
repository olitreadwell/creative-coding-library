import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "shader-gradient",
  title: "Shader Gradient",
  description:
    "A color field that shifts slowly. Every pixel color is computed on the GPU using a GLSL shader program.",
  library: "ogl",
  concepts: ["shader", "gpu", "color"],
  level: 1,
  technique: "fullscreen triangle + animated fragment-shader uniforms",
  source: {
    author: "Patricio Gonzalez Vivo",
    title: "The Book of Shaders",
    url: "https://thebookofshaders.com/",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T07:50:36+12:00",
  prereqs: ["hsl-palette"],
  understandWhen:
    "You can read a GLSL color expression and predict the output hue without running the code.",
  predictPrompt:
    "If you make the time uniform run twice as fast, does the gradient animate faster, change color, or both?",
  recallChecks: [
    {
      q: "What is a GLSL uniform?",
      a: "A value passed from CPU code into a shader program. It stays constant across all pixels for a given frame but can change between frames.",
    },
    {
      q: "Why is every pixel computed independently in a fragment shader?",
      a: "GPUs run thousands of shader threads in parallel, one per pixel. Each thread has no knowledge of its neighbors, so it only computes its own color.",
    },
    {
      q: "What makes the gradient animate instead of staying still?",
      a: "The time uniform increases each frame. The shader uses it in a math expression, so the output color changes as time advances.",
    },
  ],
});
