import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      // Warn on unused vars but allow underscore-prefixed (common pattern)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow 'any' in a few spots but warn in general
      "@typescript-eslint/no-explicit-any": "warn",
      // No console.log in prod code (warn level — we use console.warn in sync)
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "api/**", "*.config.*"],
  },
);
