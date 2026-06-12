import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── 프로젝트 규칙 (SOLID / FIRST) ──
  {
    rules: {
      // SRP — 한 파일이 너무 많은 책임을 가지지 않도록
      "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
      "no-param-reassign": ["warn", { props: false }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  {
    files: ["src/app/page.tsx"],
    rules: {
      "max-lines": "off",
      "@next/next/no-img-element": "off",
    },
  },

  // 데이터/타입 파일 예외 (긴 문자열·유니온이 정상)
  {
    files: ["src/types/**/*.ts", "src/lib/defaultQuotes.ts"],
    rules: { "max-lines": "off" },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "public/sw.js"]),
]);

export default eslintConfig;
