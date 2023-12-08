const { pathsToModuleNameMapper } = require('ts-jest');
const appRoot = require('app-root-path');

const { compilerOptions: baseTsConfig } = require(
  `${appRoot}/config/tsconfig.test.json`
);

// Take the paths from tsconfig automatically from base tsconfig.json
// @link https://kulshekhar.github.io/ts-jest/docs/paths-mapping
const getTsConfigBasePaths = () => {
  return baseTsConfig.paths
    ? pathsToModuleNameMapper(baseTsConfig.paths, {
        prefix: '<rootDir>/',
      })
    : {};
};

const modules = {};

/** @type {import('ts-jest').JestConfigWithTsJest} */
//@ts-check
module.exports = {
  collectCoverageFrom: [
    'packages/**/src/**/*.{ts,tsx}',
    '!**/*.styles.ts*',
    '!**/index.ts*',
    '!**/*test*/**',
    '!**/*fixture*/**',
    '!**/*template*/**',
    '!**/*stories*',
    '!**/*.development.*',
  ],
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/scripts/styleMock.cjs',
    ...getTsConfigBasePaths(),
    // '^@udecode/plate-core$': '<rootDir>/packages/core/src',
    ...modules,
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testRegex: '(test|spec).tsx?$',
  testPathIgnorePatterns: ['/playwright/'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  setupFilesAfterEnv: ['<rootDir>/scripts/setupTests.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(react-dnd|dnd-core|@react-dnd|react-dnd-html5-backend|react-tweet)/)',
  ],
  watchman: false,
};
