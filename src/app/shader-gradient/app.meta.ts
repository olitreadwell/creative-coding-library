import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "shader-gradient",
  title: "Shader Gradient",
  description: "A fullscreen GLSL fragment shader painting a slowly morphing color field.",
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
    "You can read a GLSL color expression and predict the resulting hue without running the shader.",
  predictPrompt:
    "If you change the time uniform to move twice as fast, does the gradient animate faster, change color, or both?",
});
