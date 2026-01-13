import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const API_URL = process.env.VITE_API_URL || 'http://localhost:4030'

// Generate build info at build time
function getBuildInfo() {
  const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

  let gitHash = 'unknown'
  let buildNumber = '0'

  try {
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    buildNumber = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim()
  } catch (e) {
    console.warn('Could not get git info:', e)
  }

  return {
    version: pkg.version,
    buildNumber,
    buildDate: new Date().toISOString(),
    gitHash,
  }
}

const buildInfo = getBuildInfo()

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  define: {
    __APP_VERSION__: JSON.stringify(buildInfo.version),
    __BUILD_NUMBER__: JSON.stringify(buildInfo.buildNumber),
    __BUILD_DATE__: JSON.stringify(buildInfo.buildDate),
    __GIT_HASH__: JSON.stringify(buildInfo.gitHash),
  },
  server: {
    host: '0.0.0.0',
    port: 4010,
    proxy: {
      '/api': API_URL,
      '/uploads': API_URL,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4010,
    proxy: {
      '/api': API_URL,
      '/uploads': API_URL,
    },
  },
})

