export default {
  "{eslint.config.js,.eslintrc.js,lint-staged.config.mjs}": "eslint --fix",
  "packages/client/**/*.{js,jsx,ts,tsx}":
    "eslint --fix --config packages/client/eslint.config.js",
  "packages/{api,shared,socket,worker,infra-utils}/{src,tests}/**/*.{js,ts}":
    "eslint --fix",
  "packages/{api,shared,socket,worker,infra-utils}/*.{js,ts}": "eslint --fix",
  "**/*.{json,css,md}": "prettier --write",
};
