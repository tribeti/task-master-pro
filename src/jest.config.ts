import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>"],
  moduleDirectories: ["node_modules", "<rootDir>/node_modules"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/__test__/**/*.test.[jt]s?(x)"],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/services/**/*.ts",
    "<rootDir>/hooks/**/*.ts",
    "<rootDir>/app/actions/**/*.ts",
    // "<rootDir>/app/api/**/*.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov"],
};

export default createJestConfig(config);
