import nextConfig from "eslint-config-next";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "src/lib/creative/registry.generated.ts",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
];

export default config;
