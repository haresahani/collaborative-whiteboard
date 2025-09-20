// eslint.config.js (root)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
    // js.configs.recommended, // ESLint's base rules
    // ...tseslint.configs.recommended, // TypeScript recommended rules
    // {
    //     files: ["**/*.{ts,tsx}"],
    //     languageOptions: {
    //         parser: tseslint.parser,
    //         parserOptions: {
    //             tsconfigRootDir: import.meta.dirname,
    //             project: "./tsconfig.json", // comment/remove if it's too strict
    //         },
    //         globals: {
    //             ...globals.browser, // for frontend
    //             ...globals.node,    // for backend
    //         },
    //     },
    //     plugins: {
    //         "react-hooks": reactHooks,
    //     },
    //     rules: {
    //         "no-unused-vars": "off",
    //         "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    //         "@typescript-eslint/no-explicit-any": "off",
    //         "@typescript-eslint/explicit-module-boundary-types": "off",
    //         "@typescript-eslint/no-empty-function": "off",
    //     },
    // },
];
