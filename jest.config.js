import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

export const preset = "ts-jest";
export const testEnvironment = "node";
export const moduleNameMapper = {
  "^@/(.*)$": "<rootDir>/src/$1",
};
export const testMatch = ["**/tests/**/*.test.ts"];
export const transform = {
  "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
};
