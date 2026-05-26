import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Served from https://tristanmenzel.github.io/groundwork/ in production;
// keep the dev server (and tests) at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/groundwork/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}))
