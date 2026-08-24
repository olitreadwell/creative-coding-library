import { defineApp } from "@/lib/creative/registry";

export const meta = defineApp({
  slug: "lsystem-tree",
  title: "L-System Tree",
  description:
    "A plant grown from rewrite rules. Each letter maps to a draw command. Add iterations to add branches.",
  library: "Canvas 2D",
  concepts: ["recursion", "l-system", "generative"],
  level: 2,
  technique: "L-system expansion + turtle drawing",
  source: {
    author: "Aristid Lindenmayer",
    title: "L-systems",
    url: "https://en.wikipedia.org/wiki/L-system",
    license: "reference",
  },
  license: "MIT",
  commercialUse: "paid-gig-safe",
  kind: "creative",
  builtAt: "2026-06-05T08:44:33+12:00",
  prereqs: ["shrooms"],
  understandWhen:
    "You can expand a 3-step L-system by hand and predict the sequence of draw commands it produces.",
  predictPrompt: "If you add one more rewrite step, does the tree get taller, wider, or both?",
  recallChecks: [
    {
      q: "What do the bracket characters [ and ] do in an L-system string?",
      a: "[ saves the turtle's current position and direction; ] restores it, which is how branches are created.",
    },
    {
      q: "Why does a higher iteration count produce a more complex tree?",
      a: "Each iteration applies the rewrite rule to every character in the string, so the string grows exponentially and produces more drawing commands.",
    },
    {
      q: "What is the difference between the L-system grammar and the drawing?",
      a: "The grammar is a string of symbols; the drawing comes from reading each symbol as a turtle command like move forward, turn, or branch.",
    },
  ],
});
