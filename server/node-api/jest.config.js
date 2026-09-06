/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test/jest.setup.ts"],
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
};