module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@domains/(.*)$': '<rootDir>/src/domains/$1',
    '^@domains$': '<rootDir>/src/domains',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@utils$': '<rootDir>/src/utils',
    '^@router/(.*)$': '<rootDir>/src/router/$1',
    '^@router$': '<rootDir>/src/router',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@types$': '<rootDir>/src/types'
  },
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
}; 