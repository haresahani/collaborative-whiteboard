import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-plugin-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // 1. Ignore build outputs and dependencies
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/.next/**",
    ],
  },

  // 2. Base ESLint rules for JavaScript files only (use default parser)
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
        console: true,
      },
    },
  },

  // 3. TypeScript rules (with type-aware linting) for TS/TSX only
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    files: ["**/*.ts", "**/*.tsx"],
    ...config,
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: ["./tsconfig.eslint.json", "./packages/*/tsconfig.json"],
        tsconfigRootDir: __dirname,
      },
    },
  })),

  // 4a. Global rules not requiring TS type info
  {
    plugins: {
      prettier,
      "react-hooks": reactHooks,
    },
    rules: {
      "prettier/prettier": "error",
      "react-hooks/rules-of-hooks": "error",
      // reduce noise during internship review
      "react-hooks/exhaustive-deps": "off",
    },
  },

  // 4b. TypeScript-specific rules applied only to TS/TSX files
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // reduce noise; TS compiler will catch most
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-require-imports": "error",
    },
  },

  // 4c. Strict subset only for contexts and hooks in client (first batch)
  {
    files: [
      "packages/client/src/contexts/**/*.{ts,tsx}",
      "packages/client/src/hooks/**/*.{ts,tsx}",
    ],
    rules: {
      // turn on focused strict checks here
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

//&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&

// import js from "@eslint/js";
// import tseslint from "typescript-eslint";
// import globals from "globals";
// import prettier from "eslint-plugin-prettier";
// import reactHooks from "eslint-plugin-react-hooks";
// import path from "node:path";
// import { fileURLToPath } from "node:url";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// /** @type {import("eslint").Linter.FlatConfig[]} */
// export default [
//   // 1️⃣ Ignore build outputs and generated files
//   {
//     ignores: [
//       "**/dist/**",
//       "**/build/**",
//       "**/node_modules/**",
//       "**/.turbo/**",
//       "**/.next/**",
//     ],
//   },

//   // 2️⃣ JavaScript files (basic linting)
//   {
//     files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
//     ...js.configs.recommended,
//     languageOptions: {
//       globals: {
//         ...globals.node,
//         console: true,
//       },
//     },
//   },

//   // 3️⃣ TypeScript linting (type-aware)
//   ...tseslint.configs.recommendedTypeChecked.map((config) => ({
//     files: ["**/*.ts", "**/*.tsx"],
//     ...config,
//     languageOptions: {
//       ...config.languageOptions,
//       parserOptions: {
//         ...config.languageOptions?.parserOptions,
//         project: [
//           "./tsconfig.json", // root config
//           "./packages/*/tsconfig.json",
//         ],
//         tsconfigRootDir: __dirname,
//       },
//     },
//   })),

//   // 4️⃣ React Hooks & Prettier rules
//   {
//     plugins: {
//       prettier,
//       "react-hooks": reactHooks,
//     },
//     rules: {
//       // ✅ Strict hook rules
//       "react-hooks/rules-of-hooks": "error",
//       "react-hooks/exhaustive-deps": "warn",

//       // ✅ Enforce Prettier formatting
//       "prettier/prettier": [
//         "error",
//         {
//           endOfLine: "auto",
//         },
//       ],
//     },
//   },

//   // 5️⃣ TypeScript-specific strict rules
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//     plugins: {
//       "@typescript-eslint": tseslint.plugin,
//     },
//     rules: {
//       // ✅ Keep strict and useful rules ON
//       "@typescript-eslint/no-unused-vars": [
//         "warn",
//         { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
//       ],
//       "@typescript-eslint/no-unsafe-assignment": "warn",
//       "@typescript-eslint/no-unsafe-member-access": "warn",
//       "@typescript-eslint/no-unsafe-call": "warn",
//       "@typescript-eslint/no-unsafe-argument": "warn",
//       "@typescript-eslint/no-unsafe-return": "warn",
//       "@typescript-eslint/no-redundant-type-constituents": "warn",
//       "@typescript-eslint/no-floating-promises": "error",
//       "@typescript-eslint/no-require-imports": "error",

//       // Optional but recommended:
//       "@typescript-eslint/consistent-type-imports": "warn",
//       "@typescript-eslint/explicit-function-return-type": "warn",
//       "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],
//     },
//   },
// ];
