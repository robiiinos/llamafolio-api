/// <reference types="vitest" />

import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import GithubActionsReporter from 'vitest-github-actions-reporter'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    allowOnly: true,
    setupFiles: ['dotenv/config'],
    env: {
      NODE_ENV: 'test',
      API_URL: 'http://localhost:3034',
      // disable experimental node warnings
      NODE_NO_WARNINGS: '1',
    },
    deps: {
      registerNodeLoader: true,
    },
    reporters: process.env.GITHUB_ACTIONS ? ['default', new GithubActionsReporter()] : [],
    coverage: {
      provider: 'istanbul',
      reporter: ['json'],
      reportsDirectory: './test/coverage',
    },
  },
})