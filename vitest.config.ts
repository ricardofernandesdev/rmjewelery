import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env manually so tests have DATABASE_URI and PAYLOAD_SECRET
function loadDotEnv(): Record<string, string> {
  try {
    const envFile = readFileSync(path.resolve(__dirname, '.env'), 'utf-8')
    const env: Record<string, string> = {}
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
    }
    return env
  } catch {
    return {}
  }
}

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    setupFiles: ['./tests/setup.ts'],
    env: {
      ...loadDotEnv(),
      // Override DATABASE_URI for test environment if TEST_DATABASE_URI is set
      ...(process.env.TEST_DATABASE_URI
        ? { DATABASE_URI: process.env.TEST_DATABASE_URI }
        : {}),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@payload-config': path.resolve(__dirname, './payload.config.ts'),
    },
  },
})
