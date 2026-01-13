/// <reference types="vite/client" />

// Build-time constants injected by Vite
declare const __APP_VERSION__: string
declare const __BUILD_NUMBER__: string
declare const __BUILD_DATE__: string
declare const __GIT_HASH__: string

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly MODE: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
