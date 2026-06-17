/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PAYCOM_SMS_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
