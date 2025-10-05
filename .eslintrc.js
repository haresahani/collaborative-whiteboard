// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json", // enables rules needing type info
  },
  plugins: ["@typescript-eslint", "prettier", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // TypeScript rules
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier
  ],
  rules: {
    // Prettier integration
    "prettier/prettier": "error",

    // General JS/TS
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off", // enable later if you want stricter

    // React
    "react/react-in-jsx-scope": "off", // not needed in Next.js / Vite with React 17+
    "react/prop-types": "off", // we use TS instead of PropTypes
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
