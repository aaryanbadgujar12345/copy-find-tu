import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";
import betterTailwind from "eslint-plugin-better-tailwindcss";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Next turns on only 6 a11y rules, as warnings. Rules only: Next already
  // registers the plugin, so the full config fails with "Cannot redefine plugin".
  { rules: jsxA11y.flatConfigs.recommended.rules },
  {
    rules: {
      // role="list" on a list-style: none list is deliberate: Safari/VoiceOver drop the list semantics otherwise.
      "jsx-a11y/no-redundant-roles": [
        "error",
        { nav: ["navigation"], ul: ["list"], ol: ["list"] },
      ],
    },
  },
  // Typed rules: an unawaited promise, or an async handler passed to onClick.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  // {count && <X />} renders "0". `eslint --fix` rewrites it to a ternary.
  { rules: { "react/jsx-no-leaked-render": "error" } },
  // Unknown, conflicting and concatenated classes. Correctness only: Prettier owns order.
  betterTailwind.configs.correctness,
  {
    settings: {
      "better-tailwindcss": {
        entryPoint: "app/globals.css",
        detectComponentClasses: true,
      },
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/vendor/**",
  ]),
]);
