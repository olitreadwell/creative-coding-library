import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: [
      ".next/**",
      ".vercel/**",
      ".claude/**",
      "node_modules/**",
      "dist/**",
      "src/lib/creative/registry.generated.ts",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
];

export default config;
