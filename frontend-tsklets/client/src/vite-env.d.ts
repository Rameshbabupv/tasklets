/// <reference types="vite/client" />

// Build info injected by Vite at build time
declare const __APP_VERSION__: string
declare const __BUILD_NUMBER__: string
declare const __BUILD_DATE__: string
declare const __GIT_HASH__: string

interface ImportMetaEnv {
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
