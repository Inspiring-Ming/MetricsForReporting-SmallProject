import js from "@eslint/js";
import globals from "globals";
import jestPlugin from "eslint-plugin-jest";
import * as tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";

/** @type {import("eslint").FlatConfig[]} */
export default [
  {
    ignores: [
      "node_modules",
      "dist",
      "build",
      ".next",
      "coverage",
      "frontend/"
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      jest: jestPlugin,
    },
    rules: {
      "no-undef": "off", // Turn off no-undef as TypeScript handles this
      "indent": ["error", 2], // Enforce 2-space indentation
      "quotes": ["error", "double", { "allowTemplateLiterals": true }], // Enforce double quotes or backticks
      "semi": ["error", "always"], // Require semicolons
      "no-trailing-spaces": "error", // No trailing spaces
      "eol-last": ["error", "always"], // Ensure newline at end of file
    },
  },
];
