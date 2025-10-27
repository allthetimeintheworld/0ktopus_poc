/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALGOD_SERVER: string
  readonly VITE_ALGOD_PORT: string
  readonly VITE_ALGOD_TOKEN: string
  readonly VITE_ALGOD_NETWORK: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
