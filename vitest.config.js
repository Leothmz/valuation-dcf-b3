import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['frontend/**', 'node_modules/**'],
  },
})
