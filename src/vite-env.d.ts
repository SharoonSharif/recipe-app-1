/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string
  readonly VITE_DESCOPE_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}